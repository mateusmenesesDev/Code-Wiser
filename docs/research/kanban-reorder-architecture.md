# Arquitetura de ordenação do Board

**Status:** análise local concluída; recomendação para decisão de implementação.

## Decisão resumida

A implementação atual mistura duas decisões que deveriam ser independentes:

1. o cliente envia uma **lista final inteira** (`updates[]`);
2. o banco armazena uma posição **densa** (`0, 1, 2, ...`).

Aumentar o limite do endpoint para 500 resolve apenas a primeira falha observada. Não resolve a amplificação de trabalho: um movimento pode alterar muitas linhas e um payload de 10.000 objetos chegou a aproximadamente 808 KB no benchmark.

### Recomendação

Adotar como arquitetura-alvo:

- uma mutação semântica de movimento, por exemplo:

  ```ts
  moveTask({
    taskId,
    targetStatus,
    beforeTaskId,
    expectedBoardVersion
  })
  ```

- uma posição esparsa inteira (`BIGINT`) por escopo/status;
- um índice composto que ordene por `(escopo, status, rank, id)`;
- um lock transacional por coluna/escopo para serializar movimentos concorrentes;
- reequilíbrio local, transacional e explícitamente limitado quando não houver espaço entre dois ranks;
- rejeição de operações obsoletas por `expectedBoardVersion` ou rebase explícito no servidor.

A recomendação não é usar LexoRank nem `NUMERIC`: os ganhos normais são semelhantes aos do inteiro esparso, mas com mais regras operacionais. Também não é recomendável manter a lista final como contrato público depois que a mutação semântica existir.

### Caminho de menor risco

A migração pode ser feita em duas etapas:

1. trocar primeiro o contrato para uma operação semântica, mantendo `order` denso; isso elimina o payload grande e o limite arbitrário, mas ainda deixa o banco com custo `O(k)`;
2. adicionar `rank BIGINT`, migrar as leituras e só então retirar a renumeração densa.

Se o produto decidir não fazer a migração de schema agora, a primeira etapa é uma solução aceitável para o tamanho atual, mas não deve ser descrita como solução de escala: o servidor ainda escreverá todas as linhas afetadas.

## O que existe hoje

### Fluxo

- `Workspace` renderiza a lista filtrada, mas chama `toKanbanOrderUpdates(allTasks, data)` para reconstruir a ordem global e preservar tarefas ocultas.
- `SprintBoard` usa o conjunto da Sprint selecionada.
- `toKanbanOrderUpdates` calcula uma ordem densa por status e retorna cada item cujo `order` ou `status` mudou.
- `task.updateTaskOrders` busca todos os IDs, valida acesso/estado da Sprint, filtra mudanças e emite um `UPDATE ... FROM (VALUES ...)` dentro de uma transação.
- O contrato atualmente está limitado a 500 itens. O valor 500 é uma contenção operacional, não uma propriedade do domínio.

### Quantas linhas um movimento altera?

Não necessariamente todas as tarefas do projeto, mas todas as posições afetadas pela inserção:

- mover o primeiro item de uma coluna para o final altera aproximadamente todos os itens restantes da coluna;
- mover para o início de outra coluna altera os itens restantes da coluna de origem e todos os itens da coluna de destino;
- com filtros, a reconstrução global pode incluir itens ocultos, embora o helper tente preservar a posição relativa deles.

Portanto, atualizar 500 tarefas ao mover uma tarefa é possível e correto dentro da representação densa atual. Não é, porém, um bom contrato de interação: o cliente está enviando um estado derivado que o servidor deveria conseguir calcular a partir da intenção de movimento.

### Invariantes que a próxima arquitetura precisa preservar

- cada tarefa pertence a um projeto ou a um template, nunca aos dois;
- a autorização continua sendo validada no servidor;
- projeto cancelado permanece somente leitura;
- tarefa em Sprint concluída não pode mudar de status;
- status e posição devem mudar atomicamente;
- a ordem deve ser determinística mesmo quando dois itens têm o mesmo rank;
- snapshots de Sprint ativa continuam sendo capturados quando a mudança de status exigir isso;
- filtros não podem apagar nem reordenar incorretamente tarefas ocultas;
- duas movimentações concorrentes não podem produzir um estado que não corresponda a uma política definida.

## Alternativas consideradas

### 1. Lista final com ordem densa — estado atual

O cliente continua enviando `{ id, order, status }` para todas as linhas afetadas.

**Complexidade:**

- payload: `O(k)`;
- escrita no banco: `O(k)`;
- memória/parsing no servidor: `O(k)`;
- ordenação: simples e compacta;
- rebalanceamento: não existe, porque toda operação renumera.

**Pontos fortes:** implementação já existente, leitura simples e números pequenos.

**Pontos fracos:** payload cresce com o movimento, o limite do endpoint vira parte do comportamento do produto, há mais locks e versões MVCC, e uma lista final produzida por um cliente pode estar obsoleta quando chega ao servidor.

O PostgreSQL documenta que updates grandes podem aumentar bloat, atraso de réplicas e contenção de locks ([UPDATE](https://www.postgresql.org/docs/current/sql-update.html)).

### 2. Mutação semântica com armazenamento denso

O cliente envia somente a intenção: tarefa, status de destino e vizinho (`beforeTaskId` ou `afterTaskId`). O servidor lê as colunas autoritativas e faz a renumeração dentro de uma transação.

**Complexidade:**

- payload: `O(1)`;
- escrita no banco: `O(k)`;
- leitura: `O(k)` para descobrir/atualizar a região;
- rebalanceamento: implícito em todo movimento.

É uma melhoria importante de interface. O servidor passa a validar o movimento no escopo correto, remove a necessidade de aceitar listas arbitrariamente grandes e reduz o tráfego. Não elimina, contudo, o custo físico das atualizações.

Esse é o melhor primeiro passo se a migração de schema for adiada.

### 3. Rank inteiro esparso (`BIGINT`)

Cada coluna mantém posições com espaço entre elas, por exemplo `1_000_000`, `2_000_000`, `3_000_000`. Um movimento entre dois vizinhos recebe o valor médio; mover para o início/fim usa um valor antes/depois do limite.

**Complexidade normal:**

- payload: `O(1)`;
- escrita: `O(1)`;
- leitura ordenada: `O(log n + k)` para devolver `k` itens;
- reequilíbrio: `O(k)` apenas quando o intervalo fica sem espaço.

`BIGINT` é exato e ocupa 8 bytes. A documentação do PostgreSQL descreve `integer` como a escolha usual de tamanho/performance e `bigint` como a opção quando o alcance do inteiro não basta ([numeric types](https://www.postgresql.org/docs/current/datatype-numeric.html)).

O ponto crítico não é a aritmética; é o protocolo de concorrência. Dois movimentos no mesmo intervalo podem calcular o mesmo rank. A implementação precisa serializar a coluna, usar uma política de conflito/retry e ordenar por `rank, id` como desempate. O reequilíbrio deve ocorrer na mesma transação e nunca como uma sequência de requests do cliente.

### 4. Rank fracionário com `NUMERIC`

O servidor calcula a média exata entre dois ranks e grava o resultado em `NUMERIC`.

**Complexidade normal:** igual à do rank esparso: `O(1)` escrita e payload constante.

**Custos:** `NUMERIC` é de precisão exata, mas o PostgreSQL documenta que sua aritmética é muito mais lenta que a dos tipos inteiros e que o armazenamento é variável ([numeric types](https://www.postgresql.org/docs/current/datatype-numeric.html)). Uma coluna com escala fixa também pode arredondar o valor e eliminar o intervalo que o algoritmo supunha existir. Uma coluna sem escala fixa desloca o problema para o crescimento de precisão.

Não usar `double precision`: é inexacto e pode gerar valores indistinguíveis após operações repetidas.

### 5. Rank lexicográfico/fracionário em `TEXT`

O servidor gera uma string entre os ranks vizinhos. O algoritmo de fractional indexing da Rocicorp usa chaves de tamanho variável e expõe `generateKeyBetween`/`generateNKeysBetween` ([repositório oficial](https://github.com/rocicorp/fractional-indexing)). A descrição da Figma confirma o mesmo desenho: uma posição por item, média entre vizinhos e crescimento ocasional do tamanho da posição ([Realtime editing of ordered sequences](https://www.figma.com/blog/realtime-editing-of-ordered-sequences/)).

**Complexidade normal:** `O(1)` escrita e payload constante.

**Custos:** chaves crescem sob inserção repetida no mesmo intervalo; a comparação depende de collation; uma comparação locale-aware pode divergir do comparador byte a byte do algoritmo. O PostgreSQL deixa claro que a collation pertence à expressão/coluna e pode alterar a ordem ([collation support](https://www.postgresql.org/docs/current/collation.html)). Para esse caso seria necessário usar uma collation determinística compatível com o alfabeto do algoritmo e ordenar com `rank, id`.

LexoRank acrescenta buckets, marcadores e um processo de balanceamento. A própria documentação de suporte do Jira registra que o balanceamento pode parar por atraso de replicação de índices ([Atlassian Support](https://support.atlassian.com/jira/kb/lexorank-balance-is-very-slow-in-jira-data-center/)). Isso é uma solução válida para um produto que realmente precisa dessas propriedades, mas é complexidade desnecessária para este Board.

### 6. OT/CRDT

Não recomendo Operational Transformation ou CRDT. São adequados quando o produto precisa convergir entre edições distribuídas offline e preservar uma semântica sofisticada de edição concorrente. Este Board tem um servidor autoritativo, banco transacional e poucas operações bem definidas. A própria Figma descreve OT como mais complexa e justifica fractional indexing como alternativa mais simples para seu caso ([Figma](https://www.figma.com/blog/realtime-editing-of-ordered-sequences/)).

## Benchmark local

### Método

O harness reproduzível está em [`scripts/benchmarks/reorder-strategies.sql`](../../scripts/benchmarks/reorder-strategies.sql).

Foi executado em um container isolado `postgres:16`, usando o daemon Docker padrão:

```bash
docker --context default exec -i codewiser-reorder-bench \
  psql -X -v ON_ERROR_STOP=1 -U postgres -d reorder_bench \
  < scripts/benchmarks/reorder-strategies.sql
```

O fixture cria dois status com metade dos itens em cada um e mede o pior caso: mover o primeiro item de `TODO` para o início de `DONE`. Foram usadas 40 amostras por estratégia e tamanho. Cada amostra é revertida por um savepoint PL/pgSQL para evitar que o custo de reset ou bloat contamine a medição seguinte.

As estratégias medidas foram:

- `dense-array`: uma atualização set-based com o estado final de todas as linhas;
- `semantic-dense`: uma atualização set-based calculada pelo servidor a partir da intenção;
- `sparse-integer`: atualização de uma linha com `BIGINT`;
- `numeric-fractional`: atualização de uma linha com `NUMERIC(100,50)`;
- `lexicographic`: atualização de uma linha com rank textual.

O tempo é somente do PostgreSQL, sem HTTP, tRPC, Prisma, autenticação, React Query ou realtime. É uma comparação de custo de banco em uma máquina local, não uma previsão de latência de produção.

### Latência e linhas escritas

| Estratégia | Itens | p50 (ms) | p95 (ms) | Linhas escritas |
|---|---:|---:|---:|---:|
| dense-array | 100 | 2,524 | 2,725 | 100 |
| semantic-dense | 100 | 1,447 | 1,682 | 100 |
| sparse-integer | 100 | 0,060 | 0,205 | 1 |
| numeric-fractional | 100 | 0,063 | 0,200 | 1 |
| lexicographic | 100 | 0,051 | 0,184 | 1 |
| dense-array | 1.000 | 19,549 | 24,776 | 1.000 |
| semantic-dense | 1.000 | 17,585 | 22,576 | 1.000 |
| sparse-integer | 1.000 | 0,072 | 0,117 | 1 |
| numeric-fractional | 1.000 | 0,066 | 0,077 | 1 |
| lexicographic | 1.000 | 0,053 | 0,064 | 1 |
| dense-array | 10.000 | 206,210 | 221,038 | 10.000 |
| semantic-dense | 10.000 | 201,871 | 237,511 | 10.000 |
| sparse-integer | 10.000 | 0,089 | 0,175 | 1 |
| numeric-fractional | 10.000 | 0,067 | 0,104 | 1 |
| lexicographic | 10.000 | 0,059 | 0,100 | 1 |

O resultado decisivo é a quantidade de linhas, não a diferença de poucos microssegundos entre os ranks. O rank esparso, `NUMERIC` e textual permaneceram constantes no cenário normal; a representação densa cresceu linearmente.

O `semantic-dense` não é magicamente barato no banco: ele reduz o payload, mas ainda escreve todas as linhas. A pequena diferença contra `dense-array` vem da forma da query, não de uma redução de trabalho do domínio.

### Payload aproximado

O mesmo movimento, serializado como JSON com IDs de 36 caracteres, produziu:

| Contrato | Itens | Objetos | Bytes JSON |
|---|---:|---:|---:|
| lista final | 100 | 100 | 7.880 |
| movimento semântico | 100 | 1 | 130 |
| lista final | 1.000 | 1.000 | 79.780 |
| movimento semântico | 1.000 | 1 | 130 |
| lista final | 10.000 | 10.000 | 807.780 |
| movimento semântico | 10.000 | 1 | 130 |

Isso não inclui compressão HTTP. Ainda assim, o contrato semântico elimina a causa do erro de limite e reduz o tráfego em ordens de grandeza.

### Concentração de ranks

O harness também inseriu 200 itens repetidamente no mesmo intervalo:

- sparse `BIGINT`, com intervalo inicial de 1.000.000.000: sem espaço após a 30ª inserção no mesmo intervalo; 6 reequilíbrios em 200 inserções;
- `NUMERIC(100,50)`: sem espaço após a 168ª inserção; 1 reequilíbrio;
- rank textual: não esgotou o intervalo, mas a chave chegou a 201 caracteres.

Esse cenário é deliberadamente adversarial. Ele não invalida o inteiro esparso; mostra que o reequilíbrio é parte do design e precisa ser implementado, observado e testado. Também mostra por que “nunca haverá colisão” não é uma especificação suficiente para ranks fracionários.

### Tamanho local

Depois de `VACUUM FULL` no fixture isolado:

| Tipo do valor | Tamanho médio da coluna |
|---|---:|
| `integer` denso | 4,00 bytes |
| `BIGINT` esparso | 8,00 bytes |
| `NUMERIC(100,50)` | 6,89 bytes |
| rank textual inicial | 9,00 bytes |

Os índices medidos no fixture foram pequenos demais para servir como previsão de produção, mas confirmam o custo conceitual: inteiro tem tamanho fixo; `NUMERIC` e texto têm representação variável. O índice de uma posição textual ou numérica também deve ser incluído no orçamento de armazenamento.

## Concorrência e consistência

O contrato atual aceita um estado final calculado no cliente. Duas pessoas podem abrir a mesma lista, mover itens diferentes e enviar duas listas completas. No nível `READ COMMITTED`, uma segunda atualização pode esperar a primeira e aplicar parte de sua intenção sobre versões novas, criando um resultado que não corresponde integralmente a nenhuma das duas listas originais. A documentação do PostgreSQL descreve exatamente essa semântica para `UPDATE` e também alerta que `READ COMMITTED` pode ser inadequado para condições de busca complexas ([transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)).

Para o contrato semântico, a política precisa ser explícita:

1. a transação adquire um lock transacional para o escopo/status afetado, sempre em ordem determinística quando houver duas colunas;
2. lê a tarefa e seus vizinhos com os dados atuais;
3. valida projeto, template, Sprint e status;
4. calcula o novo rank;
5. grava a tarefa, e somente a tarefa, no caso normal;
6. faz reequilíbrio local se necessário;
7. confirma a transação.

`pg_advisory_xact_lock` é uma boa opção para o primeiro desenho porque o lock é liberado automaticamente no fim da transação. Locks transacionais advisory não são impostos pelo banco: todos os caminhos que movem uma tarefa precisam usar a mesma chave. A documentação cobre essa propriedade em [explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html).

`SELECT ... FOR UPDATE` também funciona, mas selecionar apenas o item movido não protege o intervalo entre seus vizinhos. Para duas colunas, locks de linhas devem ser adquiridos na mesma ordem para reduzir deadlocks. O PostgreSQL recomenda ordem consistente de aquisição ou retry de transações abortadas por deadlock ([explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)).

`SERIALIZABLE` oferece uma garantia mais forte, mas exige que a aplicação repita transações que falharem com SQLSTATE `40001` ([transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)). Eu não o usaria como primeira solução para todo o Board: um lock por coluna é mais previsível e torna a política de conflito local e observável.

O rank não precisa ser único se o índice ordenar por `(rank, id)`. Se a equipe quiser detectar colisões como erro, pode usar uma constraint única e retry; se quiser que o servidor linearize tudo, o lock por coluna deve ser a primeira defesa. O desempate por ID é obrigatório de qualquer forma, porque um rank igual sem segundo critério não define ordem.

## Migração proposta

### Fase 0 — contrato

Criar uma mutação semântica server-side, sem remover imediatamente a antiga:

```ts
moveTask({
  taskId: string,
  targetStatus: TaskStatusEnum,
  beforeTaskId?: string | null,
  expectedBoardVersion?: number
})
```

O contrato deve aceitar “fim da coluna” sem exigir um item vizinho. `beforeTaskId` deve ser validado como pertencente ao mesmo escopo e status de destino. O servidor não deve aceitar um ID de outra tarefa, projeto ou template como referência.

A camada do dnd precisa expor a intenção do movimento ou derivá-la a partir do estado anterior e posterior antes de chamar o servidor. Não é suficiente continuar enviando o array final com outro nome.

### Fase 1 — semântica com `order` denso

- implementar `moveTask` usando a mesma transação e as mesmas validações de `updateTaskOrders`;
- calcular e atualizar as colunas no servidor;
- adicionar teste de movimento dentro da coluna, entre colunas, para o início/fim e com tarefa oculta por filtro;
- adicionar teste concorrente para duas movimentações no mesmo status;
- migrar `Workspace` e `SprintBoard`;
- manter a atualização otimista local, mas fazer rollback/invalidação com a resposta da mutação;
- remover o limite de array apenas quando nenhum chamador usar mais o contrato de lista;
- retirar `toKanbanOrderUpdates` quando o último chamador real tiver migrado.

Esta fase já reduz o tráfego de `O(k)` para `O(1)` e elimina o limite artificial do cliente. O custo de banco continua `O(k)`.

### Fase 2 — `rank BIGINT`

Adicionar uma coluna nova, em vez de mudar silenciosamente o tipo de `order`:

```prisma
rank BigInt?
```

A coluna deve ter índices que reflitam os dois escopos existentes — projeto e template — e o status. O backfill deve ordenar por `order` e um desempate estável, atribuindo uma distância inicial, por exemplo 1.000.000. A migração deve ser feita em batches se o banco real for grande; não usar o endpoint de produto para o backfill.

Depois do backfill:

1. escrever `rank` em criação e movimentação;
2. ler por `rank, id`;
3. verificar que nenhum item relevante ficou sem rank;
4. marcar `rank` como não nulo quando a verificação terminar;
5. remover o uso de `order` dos caminhos de leitura;
6. somente então remover a coluna antiga em uma migração separada.

O reequilíbrio deve operar uma janela da coluna, não o projeto inteiro. Ele precisa:

- verificar que o intervalo realmente não comporta outro inteiro;
- adquirir o lock da coluna;
- selecionar uma janela limitada em ordem estável;
- atribuir ranks novamente com distância suficiente;
- confirmar tudo numa transação;
- emitir métricas de contagem e duração.

Uma implementação inicial pode reequilibrar a coluna inteira sob o lock se a janela local aumentar demais a complexidade. O ponto importante é que essa operação seja uma decisão do servidor, não uma sequência de requests do navegador.

## Matriz de decisão

| Opção | Payload | Escrita normal | Concorrência | Migração | Veredito |
|---|---:|---:|---|---|---|
| lista + denso | `O(k)` | `O(k)` | frágil com estado final obsoleto | nenhuma | manter somente como compatibilidade temporária |
| semântico + denso | `O(1)` | `O(k)` | boa com lock/versionamento | baixa | melhor etapa intermediária |
| semântico + `BIGINT` | `O(1)` | `O(1)` | boa com lock/retry | média | **recomendação final** |
| semântico + `NUMERIC` | `O(1)` | `O(1)` | igual ao inteiro | média | rejeitar por custo sem benefício necessário |
| semântico + texto | `O(1)` | `O(1)` | exige collation/tie-break/retry | média/alta | rejeitar neste produto |
| OT/CRDT | variável | variável | muito sofisticada | alta | fora do problema atual |

## Conclusão

Não, o sistema não deveria tratar “mover uma tarefa” como “aceitar do cliente uma lista de centenas de posições finais”. A representação densa torna essa lista compreensível, mas o contrato expõe uma consequência interna que deveria estar escondida atrás de um módulo server-side mais profundo.

A escolha pragmática é semântica primeiro e rank esparso depois. O benchmark mostra que a etapa semântica resolve o problema de rede imediatamente, enquanto o `BIGINT` resolve também a amplificação no banco no caminho normal. O custo residual — reequilíbrio de uma coluna e serialização de movimentos concorrentes — é finito, testável e localizável. É um trade-off melhor que manter um limite crescente de 100 para 500 para um payload que o servidor já tem informação suficiente para não receber.

## Fontes

- PostgreSQL — [Numeric Types](https://www.postgresql.org/docs/current/datatype-numeric.html)
- PostgreSQL — [UPDATE](https://www.postgresql.org/docs/current/sql-update.html)
- PostgreSQL — [Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- PostgreSQL — [Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- PostgreSQL — [Collation Support](https://www.postgresql.org/docs/current/collation.html)
- PostgreSQL — [Multicolumn Indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html)
- PostgreSQL — [Heap-Only Tuples](https://www.postgresql.org/docs/current/storage-hot.html)
- Figma — [Realtime editing of ordered sequences](https://www.figma.com/blog/realtime-editing-of-ordered-sequences/)
- Rocicorp — [fractional-indexing](https://github.com/rocicorp/fractional-indexing)
- Atlassian — [LexoRank balance is very slow in Jira Data Center](https://support.atlassian.com/jira/kb/lexorank-balance-is-very-slow-in-jira-data-center/)
