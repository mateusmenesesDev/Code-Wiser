-- Disposable benchmark for Kanban ordering strategies.
-- Run against an isolated PostgreSQL 16 database only.
--
-- psql -X -v ON_ERROR_STOP=1 -f scripts/benchmarks/reorder-strategies.sql

DROP TABLE IF EXISTS reorder_bench_items;
CREATE TABLE reorder_bench_items (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    board_size integer NOT NULL,
    column_id text NOT NULL,
    base_column text NOT NULL,
    base_position integer NOT NULL,
    dense_order integer NOT NULL,
    sparse_rank bigint NOT NULL,
    numeric_rank numeric(100, 50) NOT NULL,
    lex_rank text NOT NULL
);

CREATE INDEX reorder_bench_dense_idx
    ON reorder_bench_items (board_size, column_id, dense_order);
CREATE INDEX reorder_bench_sparse_idx
    ON reorder_bench_items (board_size, column_id, sparse_rank);
CREATE INDEX reorder_bench_numeric_idx
    ON reorder_bench_items (board_size, column_id, numeric_rank);
CREATE INDEX reorder_bench_lex_idx
    ON reorder_bench_items (board_size, column_id, lex_rank);
CREATE INDEX reorder_bench_base_idx
    ON reorder_bench_items (board_size, base_column, base_position);

INSERT INTO reorder_bench_items (
    board_size,
    column_id,
    base_column,
    base_position,
    dense_order,
    sparse_rank,
    numeric_rank,
    lex_rank
)
SELECT
    sizes.board_size,
    CASE WHEN positions.position < sizes.board_size / 2 THEN 'TODO' ELSE 'DONE' END,
    CASE WHEN positions.position < sizes.board_size / 2 THEN 'TODO' ELSE 'DONE' END,
    CASE
        WHEN positions.position < sizes.board_size / 2 THEN positions.position
        ELSE positions.position - sizes.board_size / 2
    END,
    CASE
        WHEN positions.position < sizes.board_size / 2 THEN positions.position
        ELSE positions.position - sizes.board_size / 2
    END,
    (
        CASE
            WHEN positions.position < sizes.board_size / 2 THEN positions.position
            ELSE positions.position - sizes.board_size / 2
        END + 1
    )::bigint * 1000000,
    (
        CASE
            WHEN positions.position < sizes.board_size / 2 THEN positions.position
            ELSE positions.position - sizes.board_size / 2
        END + 1
    )::numeric * 1000000,
    lpad(
        (
            CASE
                WHEN positions.position < sizes.board_size / 2 THEN positions.position
                ELSE positions.position - sizes.board_size / 2
            END
        )::text,
        8,
        '0'
    )
FROM unnest(ARRAY[100, 1000, 10000]) AS sizes(board_size)
CROSS JOIN LATERAL generate_series(0, sizes.board_size - 1) AS positions(position);

ANALYZE reorder_bench_items;

CREATE OR REPLACE FUNCTION reset_dense_board(p_size integer)
RETURNS void
LANGUAGE sql
AS $$
    UPDATE reorder_bench_items
    SET column_id = base_column, dense_order = base_position
    WHERE board_size = p_size;
$$;

CREATE OR REPLACE FUNCTION reset_sparse_board(p_size integer)
RETURNS void
LANGUAGE sql
AS $$
    UPDATE reorder_bench_items
    SET column_id = base_column, sparse_rank = (base_position + 1)::bigint * 1000000
    WHERE board_size = p_size;
$$;

CREATE OR REPLACE FUNCTION reset_numeric_board(p_size integer)
RETURNS void
LANGUAGE sql
AS $$
    UPDATE reorder_bench_items
    SET column_id = base_column, numeric_rank = (base_position + 1)::numeric * 1000000
    WHERE board_size = p_size;
$$;

CREATE OR REPLACE FUNCTION reset_lex_board(p_size integer)
RETURNS void
LANGUAGE sql
AS $$
    UPDATE reorder_bench_items
    SET column_id = base_column, lex_rank = lpad(base_position::text, 8, '0')
    WHERE board_size = p_size;
$$;

-- Models the current client contract: the caller sends every final row value
-- affected by inserting the first TODO item at the beginning of DONE.
CREATE OR REPLACE FUNCTION dense_array_move(p_size integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    moved_id bigint;
    changed integer;
BEGIN
    SELECT id INTO moved_id
    FROM reorder_bench_items
    WHERE board_size = p_size
      AND base_column = 'TODO'
      AND base_position = 0;

    UPDATE reorder_bench_items AS item
    SET
        column_id = final_state.column_id,
        dense_order = final_state.dense_order
    FROM (
        SELECT
            id,
            CASE WHEN id = moved_id THEN 'DONE' ELSE base_column END AS column_id,
            CASE
                WHEN id = moved_id THEN 0
                WHEN base_column = 'TODO' THEN base_position - 1
                ELSE base_position + 1
            END AS dense_order
        FROM reorder_bench_items
        WHERE board_size = p_size
    ) AS final_state
    WHERE item.id = final_state.id;

    GET DIAGNOSTICS changed = ROW_COUNT;
    RETURN changed;
END;
$$;

-- Models a semantic move endpoint while keeping dense storage. The payload is
-- one task plus a target position; the server computes the final dense state.
-- The single statement is the fair comparison with the current bulk VALUES
-- statement; a three-statement range-shift implementation is also possible,
-- but adds round trips inside the transaction without reducing writes.
CREATE OR REPLACE FUNCTION semantic_dense_move(p_size integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    changed integer;
BEGIN
    UPDATE reorder_bench_items
    SET
        column_id = CASE
            WHEN base_column = 'TODO' AND base_position = 0 THEN 'DONE'
            ELSE base_column
        END,
        dense_order = CASE
            WHEN base_column = 'TODO' AND base_position = 0 THEN 0
            WHEN base_column = 'TODO' THEN base_position - 1
            ELSE base_position + 1
        END
    WHERE board_size = p_size;

    GET DIAGNOSTICS changed = ROW_COUNT;
    RETURN changed;
END;
$$;

CREATE OR REPLACE FUNCTION sparse_integer_move(p_size integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    moved_id bigint;
    target_rank bigint;
BEGIN
    SELECT id INTO moved_id
    FROM reorder_bench_items
    WHERE board_size = p_size
      AND base_column = 'TODO'
      AND base_position = 0;

    SELECT min(sparse_rank) - 1000000 INTO target_rank
    FROM reorder_bench_items
    WHERE board_size = p_size
      AND column_id = 'DONE';

    UPDATE reorder_bench_items
    SET column_id = 'DONE', sparse_rank = target_rank
    WHERE id = moved_id;
    RETURN 1;
END;
$$;

CREATE OR REPLACE FUNCTION numeric_fractional_move(p_size integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    moved_id bigint;
    target_rank numeric;
BEGIN
    SELECT id INTO moved_id
    FROM reorder_bench_items
    WHERE board_size = p_size
      AND base_column = 'TODO'
      AND base_position = 0;

    SELECT min(numeric_rank) - 1 INTO target_rank
    FROM reorder_bench_items
    WHERE board_size = p_size
      AND column_id = 'DONE';

    UPDATE reorder_bench_items
    SET column_id = 'DONE', numeric_rank = target_rank
    WHERE id = moved_id;
    RETURN 1;
END;
$$;

CREATE OR REPLACE FUNCTION lexicographic_move(p_size integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    moved_id bigint;
    target_rank text;
BEGIN
    SELECT id INTO moved_id
    FROM reorder_bench_items
    WHERE board_size = p_size
      AND base_column = 'TODO'
      AND base_position = 0;

    SELECT '0' || min(lex_rank) INTO target_rank
    FROM reorder_bench_items
    WHERE board_size = p_size
      AND column_id = 'DONE';

    UPDATE reorder_bench_items
    SET column_id = 'DONE', lex_rank = target_rank
    WHERE id = moved_id;
    RETURN 1;
END;
$$;

CREATE TEMP TABLE reorder_bench_samples (
    strategy text NOT NULL,
    board_size integer NOT NULL,
    iteration integer NOT NULL,
    elapsed_ms numeric NOT NULL,
    rows_written integer NOT NULL
);

DO $$
DECLARE
    p_size integer;
    iteration integer;
    started_at timestamptz;
    elapsed_ms numeric;
    writes integer;
BEGIN
    FOREACH p_size IN ARRAY ARRAY[100, 1000, 10000] LOOP
        FOR iteration IN 1..40 LOOP
            -- Roll back each sample instead of rewriting the whole board between
            -- samples. This keeps the measured operation free of reset cost and
            -- avoids making later samples slower through table bloat.
            BEGIN
                started_at := clock_timestamp();
                writes := dense_array_move(p_size);
                elapsed_ms := extract(epoch FROM clock_timestamp() - started_at) * 1000;
                RAISE EXCEPTION USING ERRCODE = 'P0001';
            EXCEPTION WHEN SQLSTATE 'P0001' THEN
                INSERT INTO reorder_bench_samples VALUES ('dense-array', p_size, iteration, elapsed_ms, writes);
            END;

            BEGIN
                started_at := clock_timestamp();
                writes := semantic_dense_move(p_size);
                elapsed_ms := extract(epoch FROM clock_timestamp() - started_at) * 1000;
                RAISE EXCEPTION USING ERRCODE = 'P0001';
            EXCEPTION WHEN SQLSTATE 'P0001' THEN
                INSERT INTO reorder_bench_samples VALUES ('semantic-dense', p_size, iteration, elapsed_ms, writes);
            END;

            BEGIN
                started_at := clock_timestamp();
                writes := sparse_integer_move(p_size);
                elapsed_ms := extract(epoch FROM clock_timestamp() - started_at) * 1000;
                RAISE EXCEPTION USING ERRCODE = 'P0001';
            EXCEPTION WHEN SQLSTATE 'P0001' THEN
                INSERT INTO reorder_bench_samples VALUES ('sparse-integer', p_size, iteration, elapsed_ms, writes);
            END;

            BEGIN
                started_at := clock_timestamp();
                writes := numeric_fractional_move(p_size);
                elapsed_ms := extract(epoch FROM clock_timestamp() - started_at) * 1000;
                RAISE EXCEPTION USING ERRCODE = 'P0001';
            EXCEPTION WHEN SQLSTATE 'P0001' THEN
                INSERT INTO reorder_bench_samples VALUES ('numeric-fractional', p_size, iteration, elapsed_ms, writes);
            END;

            BEGIN
                started_at := clock_timestamp();
                writes := lexicographic_move(p_size);
                elapsed_ms := extract(epoch FROM clock_timestamp() - started_at) * 1000;
                RAISE EXCEPTION USING ERRCODE = 'P0001';
            EXCEPTION WHEN SQLSTATE 'P0001' THEN
                INSERT INTO reorder_bench_samples VALUES ('lexicographic', p_size, iteration, elapsed_ms, writes);
            END;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'ORDER BENCHMARKS';
    FOR p_size IN SELECT DISTINCT board_size FROM reorder_bench_samples ORDER BY board_size LOOP
        RAISE NOTICE '%', p_size;
    END LOOP;

    RAISE NOTICE 'RESULTS_READY';
END $$;

CREATE TEMP TABLE reorder_bench_results AS
SELECT
    strategy,
    board_size,
    count(*) AS samples,
    round(avg(elapsed_ms), 3) AS mean_ms,
    round((percentile_cont(0.50) WITHIN GROUP (ORDER BY elapsed_ms))::numeric, 3) AS p50_ms,
    round((percentile_cont(0.95) WITHIN GROUP (ORDER BY elapsed_ms))::numeric, 3) AS p95_ms,
    min(rows_written) AS min_rows_written,
    max(rows_written) AS max_rows_written
FROM reorder_bench_samples
GROUP BY strategy, board_size;

SELECT *
FROM reorder_bench_results
ORDER BY board_size, strategy;

-- Correctness checks: every strategy moves exactly the first TODO item to the
-- beginning of DONE, without changing the relative order of the other items.
DO $$
DECLARE
    moved_column text;
    moved_order integer;
    first_target_order integer;
    moved_sparse bigint;
    first_sparse bigint;
    moved_numeric numeric;
    first_numeric numeric;
    moved_lex text;
    first_lex text;
BEGIN
    PERFORM reset_dense_board(100);
    PERFORM dense_array_move(100);
    SELECT column_id, dense_order INTO moved_column, moved_order
    FROM reorder_bench_items WHERE board_size = 100 AND base_column = 'TODO' AND base_position = 0;
    SELECT min(dense_order) INTO first_target_order
    FROM reorder_bench_items WHERE board_size = 100 AND column_id = 'DONE' AND id <> (
        SELECT id FROM reorder_bench_items WHERE board_size = 100 AND base_column = 'TODO' AND base_position = 0
    );
    IF moved_column <> 'DONE' OR moved_order <> 0 OR first_target_order <> 1 THEN
        RAISE EXCEPTION 'dense-array correctness check failed';
    END IF;

    PERFORM reset_dense_board(100);
    PERFORM semantic_dense_move(100);
    SELECT column_id, dense_order INTO moved_column, moved_order
    FROM reorder_bench_items WHERE board_size = 100 AND base_column = 'TODO' AND base_position = 0;
    IF moved_column <> 'DONE' OR moved_order <> 0 THEN
        RAISE EXCEPTION 'semantic-dense correctness check failed';
    END IF;

    PERFORM reset_sparse_board(100);
    PERFORM sparse_integer_move(100);
    SELECT column_id, sparse_rank INTO moved_column, moved_sparse
    FROM reorder_bench_items WHERE board_size = 100 AND base_column = 'TODO' AND base_position = 0;
    SELECT min(sparse_rank) INTO first_sparse
    FROM reorder_bench_items WHERE board_size = 100 AND column_id = 'DONE' AND base_position <> 0;
    IF moved_column <> 'DONE' OR moved_sparse >= first_sparse THEN
        RAISE EXCEPTION 'sparse-integer correctness check failed';
    END IF;

    PERFORM reset_numeric_board(100);
    PERFORM numeric_fractional_move(100);
    SELECT column_id, numeric_rank INTO moved_column, moved_numeric
    FROM reorder_bench_items WHERE board_size = 100 AND base_column = 'TODO' AND base_position = 0;
    SELECT min(numeric_rank) INTO first_numeric
    FROM reorder_bench_items WHERE board_size = 100 AND column_id = 'DONE' AND base_position <> 0;
    IF moved_column <> 'DONE' OR moved_numeric >= first_numeric THEN
        RAISE EXCEPTION 'numeric-fractional correctness check failed';
    END IF;

    PERFORM reset_lex_board(100);
    PERFORM lexicographic_move(100);
    SELECT column_id, lex_rank INTO moved_column, moved_lex
    FROM reorder_bench_items WHERE board_size = 100 AND base_column = 'TODO' AND base_position = 0;
    SELECT min(lex_rank) INTO first_lex
    FROM reorder_bench_items WHERE board_size = 100 AND column_id = 'DONE' AND base_position <> 0;
    IF moved_column <> 'DONE' OR moved_lex >= first_lex THEN
        RAISE EXCEPTION 'lexicographic correctness check failed';
    END IF;

    RAISE NOTICE 'CORRECTNESS: PASS';
END $$;

-- Approximate wire payloads for the same worst-case move. The current client
-- sends one object per changed item; semantic moves send one command object.
WITH final_updates AS (
    SELECT
        board_size,
        jsonb_agg(
            jsonb_build_object(
                'id', repeat('a', 36),
                'order', CASE
                    WHEN base_column = 'TODO' AND base_position = 0 THEN 0
                    WHEN base_column = 'TODO' THEN base_position - 1
                    ELSE base_position + 1
                END,
                'status', CASE
                    WHEN base_column = 'TODO' AND base_position = 0 THEN 'DONE'
                    ELSE base_column
                END
            )
        ) AS payload
    FROM reorder_bench_items
    GROUP BY board_size
), semantic_payload AS (
    SELECT jsonb_build_object(
        'taskId', repeat('a', 36),
        'targetStatus', 'DONE',
        'beforeTaskId', repeat('b', 36)
    ) AS payload
)
SELECT 'dense-array' AS strategy,
       board_size,
       jsonb_array_length(final_updates.payload) AS objects,
       octet_length(final_updates.payload::text) AS payload_bytes
FROM final_updates
UNION ALL
SELECT 'semantic-move', sizes.board_size, 1, octet_length(semantic_payload.payload::text)
FROM unnest(ARRAY[100, 1000, 10000]) AS sizes(board_size)
CROSS JOIN semantic_payload
ORDER BY board_size, strategy;

-- Repeated insertion into one gap. Integer gaps exhaust quickly, NUMERIC
-- delays exhaustion according to its scale, and lexicographic keys keep
-- working by growing in length. This measures concentration, not normal drag
-- latency.
CREATE TEMP TABLE gap_integer (id integer GENERATED ALWAYS AS IDENTITY, rank bigint);
CREATE TEMP TABLE gap_numeric (id integer GENERATED ALWAYS AS IDENTITY, rank numeric(100, 50));
CREATE TEMP TABLE gap_lex (id integer GENERATED ALWAYS AS IDENTITY, rank text);

DO $$
DECLARE
    i integer;
    low bigint := 0;
    high bigint := 1000000000;
    midpoint bigint;
    integer_exhausted_at integer := NULL;
    integer_rebalances integer := 0;
    numeric_low numeric := 0;
    numeric_high numeric := 1;
    numeric_midpoint numeric;
    numeric_exhausted_at integer := NULL;
    numeric_rebalances integer := 0;
    lex_high text := 'z';
    lex_key text;
    lex_max_length integer := 1;
BEGIN
    INSERT INTO gap_integer(rank) VALUES (low), (high);
    INSERT INTO gap_numeric(rank) VALUES (numeric_low), (numeric_high);
    INSERT INTO gap_lex(rank) VALUES ('0'), (lex_high);

    FOR i IN 1..200 LOOP
        IF high - low <= 1 THEN
            IF integer_exhausted_at IS NULL THEN integer_exhausted_at := i; END IF;
            integer_rebalances := integer_rebalances + 1;
            low := 0;
            high := 1000000000;
        END IF;
        midpoint := low + ((high - low) / 2);
        INSERT INTO gap_integer(rank) VALUES (midpoint);
        high := midpoint;

        IF numeric_high - numeric_low <= 0.00000000000000000000000000000000000000000000000001 THEN
            IF numeric_exhausted_at IS NULL THEN numeric_exhausted_at := i; END IF;
            numeric_rebalances := numeric_rebalances + 1;
            numeric_low := 0;
            numeric_high := 1;
        END IF;
        numeric_midpoint := round((numeric_low + numeric_high) / 2, 50);
        INSERT INTO gap_numeric(rank) VALUES (numeric_midpoint);
        numeric_high := numeric_midpoint;

        lex_key := '0' || lex_high;
        INSERT INTO gap_lex(rank) VALUES (lex_key);
        lex_high := lex_key;
        lex_max_length := greatest(lex_max_length, length(lex_key));
    END LOOP;

    RAISE NOTICE 'GAP_STRESS integer_exhausted_at=% integer_rebalances=% numeric_exhausted_at=% numeric_rebalances=% lex_max_length=%',
        integer_exhausted_at, integer_rebalances, numeric_exhausted_at, numeric_rebalances, lex_max_length;
END $$;

SELECT 'gap-stress' AS scenario,
       (SELECT count(*) FROM gap_integer) AS integer_rows,
       (SELECT count(*) FROM gap_numeric) AS numeric_rows,
       (SELECT max(length(rank)) FROM gap_lex) AS max_lex_rank_length;

-- Compact the disposable table before measuring storage. The latency samples
-- above deliberately use rolled-back writes, which can leave dead pages.
VACUUM (FULL, ANALYZE) reorder_bench_items;

SELECT c.relname, pg_size_pretty(pg_relation_size(c.oid)) AS relation_size
FROM pg_class AS c
WHERE c.relname IN (
    'reorder_bench_items',
    'reorder_bench_dense_idx',
    'reorder_bench_sparse_idx',
    'reorder_bench_numeric_idx',
    'reorder_bench_lex_idx',
    'reorder_bench_base_idx'
)
ORDER BY c.relname;

SELECT
    round(avg(pg_column_size(dense_order)), 2) AS dense_bytes,
    round(avg(pg_column_size(sparse_rank)), 2) AS sparse_bytes,
    round(avg(pg_column_size(numeric_rank)), 2) AS numeric_bytes,
    round(avg(pg_column_size(lex_rank)), 2) AS lex_bytes
FROM reorder_bench_items;
