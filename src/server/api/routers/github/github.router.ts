import type { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from '~/server/api/trpc';
import {
	assertProjectPermission,
	userHasAccessToProject,
	type ResourceAccessContext
} from '~/server/utils/auth';
import {
	GitHubServiceError,
	githubAppInstallUrl,
	isGitHubAppConfigured,
	getPullRequestSnapshot,
	listInstallationRepositories,
	listPullRequests
} from '~/server/services/github/github';

const repositoryNameSchema = z
	.string()
	.trim()
	.regex(
		/^[\w.-]+\/[\w.-]+$/,
		'Use a repository full name such as owner/repository'
	);

const repositoryInputSchema = z.object({
	installationId: z.string().min(1),
	fullName: repositoryNameSchema
});

function githubError(error: unknown): never {
	if (error instanceof GitHubServiceError) {
		throw new TRPCError({
			code: error.status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
			message: error.message
		});
	}
	throw error;
}

async function getInstallationForUser(
	ctx: { db: PrismaClient },
	userId: string,
	installationId: string
) {
	const installation = await ctx.db.gitHubInstallation.findFirst({
		where: { id: installationId, userId, active: true },
		select: {
			id: true,
			githubInstallationId: true,
			accountLogin: true,
			accountType: true
		}
	});
	if (!installation) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'GitHub installation not found'
		});
	}
	return installation;
}

async function verifyRepositoryAccess(
	ctx: ResourceAccessContext,
	repositoryId: string
) {
	const repository = await ctx.db.gitHubRepository.findUnique({
		where: { id: repositoryId },
		include: {
			installation: { select: { githubInstallationId: true, active: true } },
			project: { select: { id: true } },
			exerciseTrack: { select: { id: true } }
		}
	});
	if (!repository || !repository.installation.active) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'GitHub repository not found'
		});
	}
	if (repository.project) {
		await userHasAccessToProject(ctx, repository.project.id);
	} else if (!repository.exerciseTrack) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'GitHub repository is not linked'
		});
	}
	return repository;
}

async function resolveRepository(
	ctx: ResourceAccessContext,
	input: z.infer<typeof repositoryInputSchema>
) {
	const installation = await getInstallationForUser(
		ctx,
		ctx.session.userId,
		input.installationId
	);
	let repositories: Awaited<ReturnType<typeof listInstallationRepositories>>;
	try {
		repositories = await listInstallationRepositories(
			installation.githubInstallationId
		);
	} catch (error) {
		return githubError(error);
	}
	const repository = repositories.find(
		(item) => item.fullName.toLowerCase() === input.fullName.toLowerCase()
	);
	if (!repository) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'This repository is not available to the GitHub installation'
		});
	}

	const existing = await ctx.db.gitHubRepository.findUnique({
		where: {
			installationId_fullName: {
				installationId: installation.id,
				fullName: repository.fullName
			}
		},
		include: {
			project: { select: { id: true } },
			exerciseTrack: { select: { id: true } }
		}
	});

	return { installation, repository, existing };
}

export const githubRouter = createTRPCRouter({
	getConnection: protectedProcedure.query(async ({ ctx }) => {
		let installUrl: string | null = null;
		try {
			installUrl = githubAppInstallUrl();
		} catch {
			installUrl = null;
		}

		const installations = await ctx.db.gitHubInstallation.findMany({
			where: { userId: ctx.session.userId, active: true },
			orderBy: { createdAt: 'asc' },
			select: {
				id: true,
				accountLogin: true,
				accountType: true,
				repositories: {
					orderBy: { fullName: 'asc' },
					select: {
						id: true,
						fullName: true,
						htmlUrl: true,
						project: { select: { id: true, title: true } },
						exerciseTrack: { select: { id: true, name: true } }
					}
				}
			}
		});

		return {
			configured: isGitHubAppConfigured(),
			installUrl,
			installations
		};
	}),

	listRepositories: protectedProcedure
		.input(z.object({ installationId: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const installation = await getInstallationForUser(
				ctx,
				ctx.session.userId,
				input.installationId
			);
			try {
				return await listInstallationRepositories(
					installation.githubInstallationId
				);
			} catch (error) {
				return githubError(error);
			}
		}),

	listPullRequests: protectedProcedure
		.input(z.object({ repositoryId: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const repository = await verifyRepositoryAccess(ctx, input.repositoryId);
			try {
				return await listPullRequests(
					repository.installation.githubInstallationId,
					repository.owner,
					repository.name
				);
			} catch (error) {
				return githubError(error);
			}
		}),

	getPullRequest: protectedProcedure
		.input(
			z.object({
				repositoryId: z.string().min(1),
				number: z.number().int().positive().max(1_000_000_000)
			})
		)
		.query(async ({ ctx, input }) => {
			const repository = await verifyRepositoryAccess(ctx, input.repositoryId);
			try {
				return await getPullRequestSnapshot(
					repository.installation.githubInstallationId,
					repository.owner,
					repository.name,
					input.number
				);
			} catch (error) {
				return githubError(error);
			}
		}),

	linkProjectRepository: protectedProcedure
		.input(repositoryInputSchema.extend({ projectId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			await assertProjectPermission(ctx, input.projectId, 'MANAGE_GITHUB');
			const resolved = await resolveRepository(ctx, input);
			if (
				resolved.existing?.project &&
				resolved.existing.project.id !== input.projectId
			) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This repository is already linked to another project'
				});
			}
			if (resolved.existing?.exerciseTrack) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This repository is already linked to an exercise track'
				});
			}

			const linked = await ctx.db.gitHubRepository.upsert({
				where: {
					installationId_fullName: {
						installationId: resolved.installation.id,
						fullName: resolved.repository.fullName
					}
				},
				create: {
					owner: resolved.repository.owner,
					name: resolved.repository.name,
					fullName: resolved.repository.fullName,
					htmlUrl: resolved.repository.htmlUrl,
					private: resolved.repository.private,
					installationId: resolved.installation.id,
					project: { connect: { id: input.projectId } }
				},
				update: {
					owner: resolved.repository.owner,
					name: resolved.repository.name,
					htmlUrl: resolved.repository.htmlUrl,
					private: resolved.repository.private,
					project: { connect: { id: input.projectId } }
				}
			});
			return linked;
		}),

	unlinkProjectRepository: protectedProcedure
		.input(z.object({ projectId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			await assertProjectPermission(ctx, input.projectId, 'MANAGE_GITHUB');
			await ctx.db.project.update({
				where: { id: input.projectId },
				data: { githubRepository: { disconnect: true } }
			});
			return { success: true as const };
		}),

	linkExerciseTrackRepository: adminProcedure
		.input(repositoryInputSchema.extend({ trackId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const track = await ctx.db.exerciseTrack.findUnique({
				where: { id: input.trackId },
				select: { id: true }
			});
			if (!track) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Track not found' });
			}
			const resolved = await resolveRepository(ctx, input);
			if (
				resolved.existing?.exerciseTrack &&
				resolved.existing.exerciseTrack.id !== input.trackId
			) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This repository is already linked to another exercise track'
				});
			}
			if (resolved.existing?.project) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This repository is already linked to a project'
				});
			}

			const linked = await ctx.db.gitHubRepository.upsert({
				where: {
					installationId_fullName: {
						installationId: resolved.installation.id,
						fullName: resolved.repository.fullName
					}
				},
				create: {
					owner: resolved.repository.owner,
					name: resolved.repository.name,
					fullName: resolved.repository.fullName,
					htmlUrl: resolved.repository.htmlUrl,
					private: resolved.repository.private,
					installationId: resolved.installation.id,
					exerciseTrack: { connect: { id: input.trackId } }
				},
				update: {
					owner: resolved.repository.owner,
					name: resolved.repository.name,
					htmlUrl: resolved.repository.htmlUrl,
					private: resolved.repository.private,
					exerciseTrack: { connect: { id: input.trackId } }
				}
			});
			await ctx.db.exerciseTrack.update({
				where: { id: input.trackId },
				data: { repoUrl: linked.htmlUrl }
			});
			return linked;
		}),

	unlinkExerciseTrackRepository: adminProcedure
		.input(z.object({ trackId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.exerciseTrack.update({
				where: { id: input.trackId },
				data: { githubRepository: { disconnect: true } }
			});
			return { success: true as const };
		})
});
