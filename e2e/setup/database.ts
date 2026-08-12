import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
	PrismaClient,
	ProjectAccessTypeEnum,
	ProjectDifficultyEnum,
	ProjectMethodologyEnum,
	ProjectStatusEnum
} from '@prisma/client';

export const e2ePrefix = '__E2E_P0_4__';
export const fixturePath = path.resolve(
	process.cwd(),
	'playwright/.artifacts/p0-4-fixture.json'
);

export type E2EFixture = {
	runId: string;
	categoryId: string;
	templateId: string;
	templateTitle: string;
	projectTitle: string;
	taskTitle: string;
	comment: string;
	prUrl: string;
	reviewRequestKey: string;
	userId: string;
	adminId: string;
	userName: string;
	adminName: string;
};

const required = (name: string): string => {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`Missing required E2E environment variable: ${name}`);
	}
	return value;
};

export const e2eDatabaseUrl = (): string => {
	const databaseUrl = required('E2E_DATABASE_URL');
	if (
		process.env.NODE_ENV === 'production' ||
		process.env.ENVIRONMENT === 'production' ||
		process.env.VERCEL_ENV === 'production' ||
		process.env.RAILWAY_ENVIRONMENT === 'production'
	) {
		throw new Error(
			'E2E database setup is disabled in production environments'
		);
	}
	return databaseUrl;
};

const deleteProject = async (prisma: PrismaClient, projectId: string) => {
	const tasks = await prisma.task.findMany({
		where: { projectId },
		select: { id: true }
	});
	const taskIds = tasks.map((task) => task.id);

	if (taskIds.length > 0) {
		await prisma.pullRequestReview.deleteMany({
			where: { taskId: { in: taskIds } }
		});
		await prisma.comment.deleteMany({ where: { taskId: { in: taskIds } } });
		await prisma.taskAttachment.deleteMany({
			where: { taskId: { in: taskIds } }
		});
		await prisma.planningPokerVote.deleteMany({
			where: { taskId: { in: taskIds } }
		});
		await prisma.creditTransaction.deleteMany({
			where: { externalReference: { in: taskIds } }
		});
	}

	await prisma.planningPokerSession.deleteMany({ where: { projectId } });
	await prisma.projectMemberRemovalAudit.deleteMany({ where: { projectId } });
	await prisma.projectCreditPaymentEvidence.deleteMany({
		where: { projectId }
	});
	await prisma.projectInvitation.deleteMany({ where: { projectId } });
	await prisma.task.deleteMany({ where: { projectId } });
	await prisma.epic.deleteMany({ where: { projectId } });
	await prisma.sprint.deleteMany({ where: { projectId } });
	await prisma.project.delete({ where: { id: projectId } });
};

const deleteTemplate = async (prisma: PrismaClient, templateId: string) => {
	const tasks = await prisma.task.findMany({
		where: { projectTemplateId: templateId },
		select: { id: true }
	});
	const taskIds = tasks.map((task) => task.id);

	if (taskIds.length > 0) {
		await prisma.comment.deleteMany({ where: { taskId: { in: taskIds } } });
		await prisma.taskAttachment.deleteMany({
			where: { taskId: { in: taskIds } }
		});
		await prisma.task.deleteMany({
			where: { id: { in: taskIds } }
		});
	}

	await prisma.epic.deleteMany({ where: { projectTemplateId: templateId } });
	await prisma.sprint.deleteMany({ where: { projectTemplateId: templateId } });
	await prisma.projectImage.deleteMany({
		where: { projectTemplateId: templateId }
	});
	await prisma.learningOutcome.deleteMany({
		where: { projectTemplateId: templateId }
	});
	await prisma.milestone.deleteMany({
		where: { projectTemplateId: templateId }
	});
	await prisma.projectTemplate.delete({ where: { id: templateId } });
};

export async function cleanupFixture(
	prisma: PrismaClient,
	fixture: E2EFixture
) {
	const projects = await prisma.project.findMany({
		where: { title: fixture.projectTitle },
		select: { id: true }
	});
	for (const project of projects) {
		await deleteProject(prisma, project.id);
	}

	const templates = await prisma.projectTemplate.findMany({
		where: { title: fixture.templateTitle },
		select: { id: true }
	});
	for (const template of templates) {
		await deleteTemplate(prisma, template.id);
	}

	await prisma.creditTransaction.deleteMany({
		where: {
			OR: [
				{ idempotencyKey: `pr-review:${fixture.reviewRequestKey}` },
				{ externalReference: fixture.projectTitle }
			]
		}
	});
	await prisma.notification.deleteMany({
		where: { userId: { in: [fixture.userId, fixture.adminId] } }
	});
	await prisma.category.deleteMany({ where: { id: fixture.categoryId } });
}

export async function loadFixture(): Promise<E2EFixture> {
	return JSON.parse(await readFile(fixturePath, 'utf8')) as E2EFixture;
}

export default async function prepareFixture() {
	const databaseUrl = e2eDatabaseUrl();
	process.env.DATABASE_URL = databaseUrl;

	const userId = required('E2E_CLERK_USER_ID');
	const adminId = required('E2E_CLERK_ADMIN_ID');
	const userEmail = required('E2E_CLERK_USER_EMAIL');
	const adminEmail = required('E2E_CLERK_ADMIN_EMAIL');
	const runId = process.env.E2E_RUN_ID?.trim() || randomUUID();
	const templateTitle = `${e2ePrefix}${runId}`;
	const categoryId = `${e2ePrefix}${runId}-category`;
	const fixture: E2EFixture = {
		runId,
		categoryId,
		templateId: `${e2ePrefix}${runId}-template`,
		templateTitle,
		projectTitle: templateTitle,
		taskTitle: `${e2ePrefix}${runId} task`,
		comment: `${e2ePrefix}${runId} comment`,
		prUrl: `https://github.com/code-wiser/e2e/pull/${runId}`,
		reviewRequestKey: randomUUID(),
		userId,
		adminId,
		userName: 'E2E Student',
		adminName: 'E2E Admin'
	};

	const prisma = new PrismaClient({
		datasources: { db: { url: databaseUrl } }
	});
	await prisma.$connect();
	try {
		await cleanupFixture(prisma, fixture);
		await prisma.user.upsert({
			where: { id: userId },
			create: {
				id: userId,
				email: userEmail,
				name: fixture.userName,
				credits: 5
			},
			update: {
				email: userEmail,
				name: fixture.userName,
				credits: 5,
				isOrgAdmin: false
			}
		});
		await prisma.user.upsert({
			where: { id: adminId },
			create: {
				id: adminId,
				email: adminEmail,
				name: fixture.adminName,
				isOrgAdmin: true
			},
			update: {
				email: adminEmail,
				name: fixture.adminName,
				isOrgAdmin: true
			}
		});
		await prisma.category.create({
			data: {
				id: categoryId,
				name: `${e2ePrefix}${runId} category`,
				approved: true
			}
		});
		await prisma.projectTemplate.create({
			data: {
				id: fixture.templateId,
				title: templateTitle,
				description: 'Controlled end-to-end template',
				methodology: ProjectMethodologyEnum.KANBAN,
				minParticipants: 1,
				maxParticipants: 2,
				credits: null,
				accessType: ProjectAccessTypeEnum.FREE,
				status: ProjectStatusEnum.APPROVED,
				difficulty: ProjectDifficultyEnum.BEGINNER,
				publicCode: `${e2ePrefix}${runId}`,
				preRequisites: [],
				categoryId
			}
		});

		await mkdir(path.dirname(fixturePath), { recursive: true });
		await writeFile(fixturePath, JSON.stringify(fixture, null, 2));
	} finally {
		await prisma.$disconnect();
	}
}
