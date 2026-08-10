ALTER TABLE public."ProjectTemplate" ADD COLUMN "publicCode" STRING;
ALTER TABLE public."ProjectTemplate" ADD COLUMN "nextTaskNumber" INT4 NOT NULL DEFAULT 1;
ALTER TABLE public."Project" ADD COLUMN "publicCode" STRING;
ALTER TABLE public."Project" ADD COLUMN "nextTaskNumber" INT4 NOT NULL DEFAULT 1;
ALTER TABLE public."Task" ADD COLUMN "publicNumber" INT4;

WITH template_codes AS (
	SELECT
		id,
		COALESCE(NULLIF(left(regexp_replace(upper(title), '[^A-Z0-9]+', '', 'g'), 12), ''), 'PROJECT') AS base_code
	FROM public."ProjectTemplate"
), numbered_template_codes AS (
	SELECT
		id,
		base_code,
		row_number() OVER (PARTITION BY base_code ORDER BY id) AS rn
	FROM template_codes
)
UPDATE public."ProjectTemplate" AS template
SET "publicCode" = CASE
	WHEN numbered_template_codes.rn = 1 THEN numbered_template_codes.base_code
	ELSE concat(numbered_template_codes.base_code, '_', numbered_template_codes.rn::STRING)
END
FROM numbered_template_codes
WHERE template.id = numbered_template_codes.id;

WITH project_codes AS (
	SELECT
		id,
		COALESCE(NULLIF(left(regexp_replace(upper(title), '[^A-Z0-9]+', '', 'g'), 12), ''), 'PROJECT') AS base_code
	FROM public."Project"
), numbered_project_codes AS (
	SELECT
		id,
		base_code,
		row_number() OVER (PARTITION BY base_code ORDER BY id) AS rn
	FROM project_codes
)
UPDATE public."Project" AS project
SET "publicCode" = CASE
	WHEN numbered_project_codes.rn = 1 THEN numbered_project_codes.base_code
	ELSE concat(numbered_project_codes.base_code, '_', numbered_project_codes.rn::STRING)
END
FROM numbered_project_codes
WHERE project.id = numbered_project_codes.id;

WITH numbered_template_tasks AS (
	SELECT
		id,
		row_number() OVER (
			PARTITION BY "projectTemplateId"
			ORDER BY "order" ASC NULLS LAST, "createdAt" ASC, id ASC
		) AS task_number
	FROM public."Task"
	WHERE "projectTemplateId" IS NOT NULL
)
UPDATE public."Task" AS task
SET "publicNumber" = numbered_template_tasks.task_number
FROM numbered_template_tasks
WHERE task.id = numbered_template_tasks.id;

WITH numbered_project_tasks AS (
	SELECT
		id,
		row_number() OVER (
			PARTITION BY "projectId"
			ORDER BY "order" ASC NULLS LAST, "createdAt" ASC, id ASC
		) AS task_number
	FROM public."Task"
	WHERE "projectId" IS NOT NULL
)
UPDATE public."Task" AS task
SET "publicNumber" = numbered_project_tasks.task_number
FROM numbered_project_tasks
WHERE task.id = numbered_project_tasks.id;

UPDATE public."ProjectTemplate" AS template
SET "nextTaskNumber" = COALESCE(task_numbers."nextTaskNumber", 1)
FROM (
	SELECT "projectTemplateId", max("publicNumber") + 1 AS "nextTaskNumber"
	FROM public."Task"
	WHERE "projectTemplateId" IS NOT NULL
	GROUP BY "projectTemplateId"
) AS task_numbers
WHERE template.id = task_numbers."projectTemplateId";

UPDATE public."Project" AS project
SET "nextTaskNumber" = COALESCE(task_numbers."nextTaskNumber", 1)
FROM (
	SELECT "projectId", max("publicNumber") + 1 AS "nextTaskNumber"
	FROM public."Task"
	WHERE "projectId" IS NOT NULL
	GROUP BY "projectId"
) AS task_numbers
WHERE project.id = task_numbers."projectId";

CREATE UNIQUE INDEX "Project_publicCode_key" ON public."Project"("publicCode");
CREATE UNIQUE INDEX "Task_projectTemplateId_publicNumber_key" ON public."Task"("projectTemplateId", "publicNumber");
CREATE UNIQUE INDEX "Task_projectId_publicNumber_key" ON public."Task"("projectId", "publicNumber");
