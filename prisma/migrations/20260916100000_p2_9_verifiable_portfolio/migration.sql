ALTER TABLE "CompetencyLearningOutcome" SET (schema_locked = false);
ALTER TABLE "CompetencyMilestone" SET (schema_locked = false);

INSERT INTO "CompetencyLearningOutcome" ("competencyId", "learningOutcomeId")
SELECT DISTINCT
  mapping."competencyId",
  projectOutcome."id"
FROM "Project" project
JOIN "LearningOutcome" templateOutcome
  ON templateOutcome."projectTemplateId" = project."sourceProjectTemplateId"
JOIN "LearningOutcome" projectOutcome
  ON projectOutcome."projectId" = project."id"
 AND projectOutcome."value" = templateOutcome."value"
JOIN "CompetencyLearningOutcome" mapping
  ON mapping."learningOutcomeId" = templateOutcome."id"
ON CONFLICT ("competencyId", "learningOutcomeId") DO NOTHING;

INSERT INTO "CompetencyMilestone" ("competencyId", "milestoneId")
SELECT DISTINCT
  mapping."competencyId",
  projectMilestone."id"
FROM "Project" project
JOIN "Milestone" templateMilestone
  ON templateMilestone."projectTemplateId" = project."sourceProjectTemplateId"
JOIN "Milestone" projectMilestone
  ON projectMilestone."projectId" = project."id"
 AND projectMilestone."title" = templateMilestone."title"
 AND projectMilestone."order" = templateMilestone."order"
JOIN "CompetencyMilestone" mapping
  ON mapping."milestoneId" = templateMilestone."id"
ON CONFLICT ("competencyId", "milestoneId") DO NOTHING;

ALTER TABLE "CompetencyLearningOutcome" SET (schema_locked = true);
ALTER TABLE "CompetencyMilestone" SET (schema_locked = true);
