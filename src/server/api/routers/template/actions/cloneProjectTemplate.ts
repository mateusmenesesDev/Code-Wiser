import { randomUUID } from 'node:crypto';
import type { Prisma, ProjectStatusEnum } from '@prisma/client';
import { generatePublicCode } from '~/lib/publicTaskId';
import { KANBAN_RANK_STEP } from '~/server/api/routers/task/mutations/taskOrderUpdates';

export const templateCloneInclude = {
	sprints: true,
	epics: true,
	tasks: true,
	productVersions: true,
	technologies: true,
	learningOutcomes: { include: { competencies: true } },
	milestones: { include: { competencies: true } },
	images: {
		orderBy: { order: 'asc' as const }
	},
	category: true
} as const;

export type TemplateCloneSource = Prisma.ProjectTemplateGetPayload<{
	include: typeof templateCloneInclude;
}>;

type CloneProjectTemplateOptions = {
	templateKey: string;
	version: number;
	status: ProjectStatusEnum;
	sortOrder: number;
	changeSummary?: string | null;
};

export async function cloneProjectTemplate(
	prisma: Prisma.TransactionClient,
	originalTemplate: TemplateCloneSource,
	options: CloneProjectTemplateOptions
) {
	const {
		id: _originalId,
		createdAt: _createdAt,
		updatedAt: _updatedAt,
		templateKey: _templateKey,
		version: _version,
		status: _status,
		publishedAt: _publishedAt,
		changeSummary: _changeSummary,
		reviewNote: _reviewNote,
		title,
		categoryId: _categoryId,
		sortOrder: _originalSortOrder,
		sprints = [],
		epics = [],
		tasks = [],
		productVersions: templateProductVersions = [],
		technologies = [],
		learningOutcomes = [],
		milestones = [],
		images = [],
		category,
		...templateData
	} = originalTemplate;

	const newTemplate = await prisma.projectTemplate.create({
		data: {
			...templateData,
			title,
			publicCode: generatePublicCode(title),
			templateKey: options.templateKey,
			version: options.version,
			status: options.status,
			publishedAt: null,
			changeSummary: options.changeSummary ?? null,
			reviewNote: null,
			sortOrder: options.sortOrder,
			category: {
				connect: { id: category.id }
			},
			technologies: {
				connect: technologies.map((technology) => ({ id: technology.id }))
			}
		}
	});

	if (images.length > 0) {
		await prisma.projectImage.createMany({
			data: images.map((image) => ({
				url: image.url,
				alt: image.alt,
				order: image.order,
				projectTemplateId: newTemplate.id
			}))
		});
	}

	const productVersionIdMap: Record<string, string> = {};
	if (templateProductVersions.length > 0) {
		await prisma.productVersion.createMany({
			data: templateProductVersions.map((version) => {
				const id = randomUUID();
				productVersionIdMap[version.id] = id;
				return {
					id,
					name: version.name,
					description: version.description,
					order: version.order,
					status: null,
					projectTemplateId: newTemplate.id,
					projectId: null
				};
			})
		});
	}

	const milestoneIdMap: Record<string, string> = {};
	if (learningOutcomes.length > 0) {
		const learningOutcomeIdMap: Record<string, string> = {};
		await prisma.learningOutcome.createMany({
			data: learningOutcomes.map((outcome) => {
				const id = randomUUID();
				learningOutcomeIdMap[outcome.id] = id;
				return {
					id,
					value: outcome.value,
					projectTemplateId: newTemplate.id,
					projectId: null
				};
			})
		});

		const competencyLearningOutcomeRows = learningOutcomes.flatMap(
			(outcome) => {
				const learningOutcomeId = learningOutcomeIdMap[outcome.id];
				if (!learningOutcomeId) return [];
				return (outcome.competencies ?? []).map(({ competencyId }) => ({
					competencyId,
					learningOutcomeId
				}));
			}
		);
		if (competencyLearningOutcomeRows.length > 0) {
			await prisma.competencyLearningOutcome.createMany({
				data: competencyLearningOutcomeRows
			});
		}
	}
	if (milestones.length > 0) {
		await prisma.milestone.createMany({
			data: milestones.map((milestone) => {
				const id = randomUUID();
				milestoneIdMap[milestone.id] = id;
				return {
					id,
					title: milestone.title,
					description: milestone.description,
					order: milestone.order,
					status: milestone.status,
					completed: milestone.completed,
					projectTemplateId: newTemplate.id,
					projectId: null
				};
			})
		});

		const competencyMilestoneRows = milestones.flatMap((milestone) => {
			const milestoneId = milestoneIdMap[milestone.id];
			if (!milestoneId) return [];
			return (milestone.competencies ?? []).map(({ competencyId }) => ({
				competencyId,
				milestoneId
			}));
		});
		if (competencyMilestoneRows.length > 0) {
			await prisma.competencyMilestone.createMany({
				data: competencyMilestoneRows
			});
		}
	}

	const sprintIdMap: Record<string, string> = {};
	if (sprints.length > 0) {
		await prisma.sprint.createMany({
			data: sprints.map((sprint) => {
				const {
					id: oldId,
					projectTemplateId: _projectTemplateId,
					projectId: _projectId,
					milestoneId,
					createdAt: _sprintCreatedAt,
					updatedAt: _sprintUpdatedAt,
					...sprintData
				} = sprint;
				const id = randomUUID();
				sprintIdMap[oldId] = id;
				return {
					...sprintData,
					id,
					projectTemplateId: newTemplate.id,
					projectId: null,
					milestoneId: milestoneId
						? (milestoneIdMap[milestoneId] ?? null)
						: null
				};
			})
		});
	}

	const epicIdMap: Record<string, string> = {};
	if (epics.length > 0) {
		await prisma.epic.createMany({
			data: epics.map((epic) => {
				const {
					id: oldId,
					projectTemplateId: _projectTemplateId,
					projectId: _projectId,
					milestoneId,
					createdAt: _epicCreatedAt,
					updatedAt: _epicUpdatedAt,
					...epicData
				} = epic;
				const id = randomUUID();
				epicIdMap[oldId] = id;
				return {
					...epicData,
					id,
					projectTemplateId: newTemplate.id,
					projectId: null,
					milestoneId: milestoneId
						? (milestoneIdMap[milestoneId] ?? null)
						: null
				};
			})
		});
	}

	if (tasks.length > 0) {
		const taskIdMap = new Map(tasks.map((task) => [task.id, randomUUID()]));
		const taskRows = tasks.map((task) => {
			const {
				id: _taskId,
				epicId,
				sprintId,
				milestoneId,
				productVersionId,
				parentTaskId,
				kanbanRank: sourceKanbanRank,
				projectTemplateId: _projectTemplateId,
				projectId: _projectId,
				createdAt: _taskCreatedAt,
				updatedAt: _taskUpdatedAt,
				...taskData
			} = task;

			return {
				...taskData,
				id: taskIdMap.get(task.id) as string,
				projectTemplateId: newTemplate.id,
				parentTaskId: parentTaskId
					? (taskIdMap.get(parentTaskId) ?? null)
					: null,
				kanbanRank:
					sourceKanbanRank ??
					BigInt((taskData.order ?? 0) + 1) * KANBAN_RANK_STEP,
				epicId: epicId ? (epicIdMap[epicId] ?? null) : null,
				sprintId: sprintId ? (sprintIdMap[sprintId] ?? null) : null,
				milestoneId: milestoneId ? (milestoneIdMap[milestoneId] ?? null) : null,
				productVersionId: productVersionId
					? (productVersionIdMap[productVersionId] ?? null)
					: null,
				projectId: null
			};
		});

		const topLevelTaskRows = taskRows.filter(
			(task) => task.parentTaskId === null
		);
		const subtaskRows = taskRows.filter((task) => task.parentTaskId !== null);
		if (topLevelTaskRows.length > 0) {
			await prisma.task.createMany({ data: topLevelTaskRows });
		}
		if (subtaskRows.length > 0) {
			await prisma.task.createMany({ data: subtaskRows });
		}
	}

	return newTemplate.id;
}
