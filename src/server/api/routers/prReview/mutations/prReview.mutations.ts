import {
	PRReviewAnalysisStatus,
	PRReviewFindingDecision,
	PullRequestReviewStatusEnum
} from '@prisma/client';
import { TRPCError } from '@trpc/server';
import {
	approvePRSchema,
	createPRReviewSchema,
	requestChangesPRSchema,
	reviewAIFindingSchema,
	startAIAnalysisSchema,
	updatePRReviewUrlSchema
} from '~/features/prReview/schemas/prReview.schema';
import { adminProcedure, protectedProcedure } from '~/server/api/trpc';
import { applyCreditTransaction } from '~/server/services/creditLedger';
import {
	notifyPRRequested,
	notifyPRResponse
} from '~/server/services/notification/notificationService';
import {
	assertProjectIsActive,
	assertTaskAccess,
	userHasAccessToProject
} from '~/server/utils/auth';
import {
	GitHubServiceError,
	getPullRequestSnapshotForRepository,
	githubPullRequestRefFromUrl
} from '~/server/services/github/github';
import { PR_REVIEW_ANALYSIS_PROMPT_VERSION } from '~/server/services/prReviewAnalysis';

export const prReviewMutations = {
	startAIAnalysis: adminProcedure
		.input(startAIAnalysisSchema)
		.mutation(async ({ ctx, input }) => {
			const review = await ctx.db.pullRequestReview.findUnique({
				where: { id: input.reviewId },
				select: {
					id: true,
					isActive: true,
					status: true,
					githubHeadSha: true,
					githubPullRequestNumber: true,
					githubRepositoryId: true
				}
			});
			if (!review) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'PR review not found'
				});
			}
			if (
				!review.isActive ||
				review.status !== PullRequestReviewStatusEnum.PENDING
			) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'Only an active pending review can be analyzed'
				});
			}
			if (
				!review.githubHeadSha ||
				!review.githubRepositoryId ||
				!review.githubPullRequestNumber
			) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message:
						'Link this review to a GitHub pull request before analyzing it'
				});
			}

			const existing = await ctx.db.prReviewAnalysis.findUnique({
				where: {
					reviewId_sourceHeadSha: {
						reviewId: review.id,
						sourceHeadSha: review.githubHeadSha
					}
				},
				select: { id: true, status: true, attempts: true }
			});
			if (existing) {
				if (
					existing.status === PRReviewAnalysisStatus.COMPLETED ||
					existing.status === PRReviewAnalysisStatus.QUEUED ||
					existing.status === PRReviewAnalysisStatus.RUNNING
				) {
					return { analysisId: existing.id, status: existing.status };
				}
				if (existing.attempts >= 2) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'This analysis reached its retry limit'
					});
				}
				const retried = await ctx.db.prReviewAnalysis.update({
					where: { id: existing.id },
					data: {
						status: PRReviewAnalysisStatus.QUEUED,
						errorCode: null,
						errorMessage: null,
						completedAt: null
					}
				});
				return { analysisId: retried.id, status: retried.status };
			}

			const analysis = await ctx.db.prReviewAnalysis.upsert({
				where: {
					reviewId_sourceHeadSha: {
						reviewId: review.id,
						sourceHeadSha: review.githubHeadSha
					}
				},
				create: {
					reviewId: review.id,
					requestedById: ctx.session.userId,
					sourceHeadSha: review.githubHeadSha,
					promptVersion: PR_REVIEW_ANALYSIS_PROMPT_VERSION
				},
				update: {},
				select: { id: true, status: true }
			});
			return { analysisId: analysis.id, status: analysis.status };
		}),

	reviewAIFinding: adminProcedure
		.input(reviewAIFindingSchema)
		.mutation(async ({ ctx, input }) => {
			const finding = await ctx.db.prReviewFinding.findUnique({
				where: { id: input.findingId },
				select: {
					id: true,
					analysis: {
						select: {
							status: true,
							review: { select: { status: true, isActive: true } }
						}
					}
				}
			});
			if (!finding) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'AI finding not found'
				});
			}
			if (
				finding.analysis.status !== PRReviewAnalysisStatus.COMPLETED ||
				!finding.analysis.review.isActive ||
				finding.analysis.review.status !== PullRequestReviewStatusEnum.PENDING
			) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This AI finding is no longer editable'
				});
			}

			const { findingId, decision, ...edits } = input;
			return ctx.db.prReviewFinding.update({
				where: { id: findingId },
				data: {
					...(decision
						? { decision: decision as PRReviewFindingDecision }
						: {}),
					...(edits.severity ? { editedSeverity: edits.severity } : {}),
					...(edits.category ? { editedCategory: edits.category } : {}),
					...(edits.problem ? { editedProblem: edits.problem } : {}),
					...(edits.justification
						? { editedJustification: edits.justification }
						: {}),
					...(edits.suggestion ? { editedSuggestion: edits.suggestion } : {}),
					...(edits.confidence !== undefined
						? { editedConfidence: edits.confidence }
						: {}),
					...(decision
						? { decisionById: ctx.session.userId, decidedAt: new Date() }
						: {})
				}
			});
		}),

	approve: adminProcedure
		.input(approvePRSchema)
		.mutation(async ({ ctx, input }) => {
			const { taskId } = input;

			const activeReview = await ctx.db.pullRequestReview.findFirst({
				where: {
					taskId,
					isActive: true
				},
				include: {
					requestedBy: {
						select: {
							id: true,
							name: true,
							email: true
						}
					},
					task: {
						select: {
							id: true,
							title: true,
							project: {
								select: {
									id: true,
									title: true
								}
							}
						}
					}
				}
			});

			if (!activeReview) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'No active PR review found for this task.'
				});
			}
			if (activeReview.status !== PullRequestReviewStatusEnum.PENDING) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This review has already been decided'
				});
			}
			if (activeReview.task.project?.id) {
				await assertProjectIsActive(ctx.db, activeReview.task.project.id);
			}

			const decision = await ctx.db.pullRequestReview.updateMany({
				where: {
					id: activeReview.id,
					status: PullRequestReviewStatusEnum.PENDING
				},
				data: {
					status: PullRequestReviewStatusEnum.APPROVED,
					reviewedById: ctx.session.userId,
					reviewedAt: new Date()
				}
			});
			if (decision.count !== 1) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This review has already been decided'
				});
			}

			const mentor = await ctx.db.user.findUnique({
				where: { id: ctx.session.userId as string },
				select: { name: true }
			});

			const mentorName = mentor?.name ?? (null as string | null | undefined);

			await notifyPRResponse({
				db: ctx.db,
				memberId: activeReview.requestedById,
				memberName: activeReview.requestedBy.name,
				memberEmail: activeReview.requestedBy.email,
				mentorName,
				projectId: activeReview.task.project?.id ?? '',
				projectName: activeReview.task.project?.title ?? '',
				taskId: activeReview.task.id,
				taskTitle: activeReview.task.title,
				status: 'APPROVED'
			}).catch((error) => {
				console.error('Failed to send notification:', error);
			});

			return { success: true };
		}),

	requestChanges: adminProcedure
		.input(requestChangesPRSchema)
		.mutation(async ({ ctx, input }) => {
			const { taskId, comment, analysisId } = input;

			const activeReview = await ctx.db.pullRequestReview.findFirst({
				where: {
					taskId,
					isActive: true
				},
				include: {
					requestedBy: {
						select: {
							id: true,
							name: true,
							email: true
						}
					},
					task: {
						select: {
							id: true,
							title: true,
							project: {
								select: {
									id: true,
									title: true
								}
							}
						}
					}
				}
			});

			if (!activeReview) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'No active PR review found for this task.'
				});
			}
			if (activeReview.status !== PullRequestReviewStatusEnum.PENDING) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This review has already been decided'
				});
			}
			if (activeReview.task.project?.id) {
				await assertProjectIsActive(ctx.db, activeReview.task.project.id);
			}

			if (analysisId) {
				const analysis = await ctx.db.prReviewAnalysis.findUnique({
					where: { id: analysisId },
					select: {
						status: true,
						reviewId: true,
						sourceHeadSha: true,
						findings: {
							where: { decision: PRReviewFindingDecision.ACCEPTED },
							select: { id: true }
						}
					}
				});
				if (
					!analysis ||
					analysis.reviewId !== activeReview.id ||
					analysis.status !== PRReviewAnalysisStatus.COMPLETED ||
					analysis.sourceHeadSha !== activeReview.githubHeadSha ||
					analysis.findings.length === 0
				) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'The selected AI findings are no longer current'
					});
				}
			}

			const decision = await ctx.db.pullRequestReview.updateMany({
				where: {
					id: activeReview.id,
					status: PullRequestReviewStatusEnum.PENDING
				},
				data: {
					status: PullRequestReviewStatusEnum.CHANGES_REQUESTED,
					comment: comment || null,
					feedbackAssistedByAi: Boolean(analysisId),
					reviewedById: ctx.session.userId,
					reviewedAt: new Date()
				}
			});
			if (decision.count !== 1) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'This review has already been decided'
				});
			}

			const mentor = await ctx.db.user.findUnique({
				where: { id: ctx.session.userId as string },
				select: { name: true }
			});

			const mentorName = mentor?.name ?? (null as string | null | undefined);

			await notifyPRResponse({
				db: ctx.db,
				memberId: activeReview.requestedById,
				memberName: activeReview.requestedBy.name,
				memberEmail: activeReview.requestedBy.email,
				mentorName,
				projectId: activeReview.task.project?.id ?? '',
				projectName: activeReview.task.project?.title ?? '',
				taskId: activeReview.task.id,
				taskTitle: activeReview.task.title,
				status: 'CHANGES_REQUESTED',
				comment: comment || null
			}).catch((error) => {
				console.error('Failed to send notification:', error);
			});

			return { success: true };
		}),

	requestCodeReview: protectedProcedure
		.input(createPRReviewSchema)
		.mutation(async ({ ctx, input }) => {
			const { taskId, prUrl } = input;
			const requesterId = ctx.session.userId;
			const requestIdempotencyKey = input.idempotencyKey;

			const task = await ctx.db.task.findUnique({
				where: { id: taskId },
				select: {
					id: true,
					title: true,
					project: {
						select: {
							id: true,
							title: true,
							githubRepository: {
								select: {
									id: true,
									owner: true,
									name: true,
									installation: {
										select: { githubInstallationId: true, active: true }
									}
								}
							}
						}
					}
				}
			});

			if (!task || !task.project) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Task or project not found'
				});
			}

			await userHasAccessToProject(ctx, task.project.id);
			await assertProjectIsActive(ctx.db, task.project.id);

			const user = await ctx.db.user.findUnique({
				where: { id: requesterId },
				select: {
					id: true,
					name: true,
					email: true,
					mentorshipStatus: true
				}
			});

			if (!user) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'User not found'
				});
			}

			const existingReview = await ctx.db.pullRequestReview.findUnique({
				where: { requestIdempotencyKey },
				select: { taskId: true, requestedById: true, prUrl: true }
			});
			if (existingReview) {
				if (
					existingReview.taskId !== taskId ||
					existingReview.requestedById !== requesterId ||
					existingReview.prUrl !== prUrl
				) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'Review request key was already used for another review'
					});
				}
				return {
					success: true,
					message: 'Code review requested successfully'
				};
			}

			let reviewUrl = prUrl;
			let githubSnapshot: Awaited<
				ReturnType<typeof getPullRequestSnapshotForRepository>
			> | null = null;
			if (task.project.githubRepository) {
				if (!githubPullRequestRefFromUrl(prUrl)) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Enter a valid GitHub pull request URL'
					});
				}
				try {
					githubSnapshot = await getPullRequestSnapshotForRepository(
						task.project.githubRepository,
						prUrl
					);
					reviewUrl = githubSnapshot.htmlUrl;
				} catch (error) {
					if (error instanceof GitHubServiceError) {
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message: error.message
						});
					}
					throw error;
				}
			}

			const CODE_REVIEW_COST = 5;
			const isMentorshipActive = user.mentorshipStatus === 'ACTIVE';

			await ctx.db.$transaction(async (tx) => {
				const activeReview = await tx.pullRequestReview.findFirst({
					where: { taskId, isActive: true },
					select: { id: true, status: true }
				});

				if (activeReview?.status === PullRequestReviewStatusEnum.PENDING) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'A code review is already awaiting review for this task'
					});
				}
				if (activeReview?.status === PullRequestReviewStatusEnum.APPROVED) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'This task already has an approved code review'
					});
				}

				if (activeReview) {
					await tx.pullRequestReview.update({
						where: { id: activeReview.id },
						data: { isActive: false }
					});
				}

				if (!isMentorshipActive) {
					await applyCreditTransaction(tx, {
						userId: requesterId,
						type: 'CONSUMPTION',
						value: -CODE_REVIEW_COST,
						source: 'PR_REVIEW_REQUEST',
						externalReference: taskId,
						idempotencyKey: `pr-review:${requestIdempotencyKey}`
					});
				}

				await tx.pullRequestReview.create({
					data: {
						taskId,
						prUrl: reviewUrl,
						requestIdempotencyKey,
						status: PullRequestReviewStatusEnum.PENDING,
						requestedById: requesterId,
						isActive: true,
						...(githubSnapshot
							? {
									githubRepositoryId: task.project?.githubRepository?.id,
									githubPullRequestNumber: githubSnapshot.number,
									githubTitle: githubSnapshot.title,
									githubState: githubSnapshot.state,
									githubAuthorLogin: githubSnapshot.authorLogin,
									githubCommitCount: githubSnapshot.commitCount,
									githubHeadSha: githubSnapshot.headSha,
									githubChecksStatus: githubSnapshot.checksStatus,
									githubLastSyncedAt: new Date()
								}
							: {})
					}
				});
			});

			await notifyPRRequested({
				db: ctx.db,
				memberName: user.name,
				projectId: task.project.id,
				projectName: task.project.title,
				taskId: task.id,
				taskTitle: task.title,
				prUrl: reviewUrl
			}).catch((error) => {
				console.error('Failed to send notification:', error);
			});

			return { success: true, message: 'Code review requested successfully' };
		}),

	updatePRReviewUrl: protectedProcedure
		.input(updatePRReviewUrlSchema)
		.mutation(async ({ ctx, input }) => {
			const { reviewId, prUrl } = input;

			const review = await ctx.db.pullRequestReview.findUnique({
				where: { id: reviewId },
				select: {
					taskId: true,
					requestedById: true,
					task: {
						select: {
							projectId: true,
							project: {
								select: {
									githubRepository: {
										select: {
											id: true,
											owner: true,
											name: true,
											installation: {
												select: {
													githubInstallationId: true,
													active: true
												}
											}
										}
									}
								}
							}
						}
					}
				}
			});
			if (!review) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'PR review not found'
				});
			}
			if (review.requestedById !== ctx.session.userId && !ctx.isAdmin) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only the requester or an admin can update this PR review'
				});
			}

			await assertTaskAccess(ctx, review.taskId);
			if (review.task.projectId) {
				await assertProjectIsActive(ctx.db, review.task.projectId);
			}

			let reviewUrl = prUrl;
			let githubData: Awaited<
				ReturnType<typeof getPullRequestSnapshotForRepository>
			> | null = null;
			const githubRepository = review.task.project?.githubRepository;
			if (githubRepository) {
				try {
					githubData = await getPullRequestSnapshotForRepository(
						githubRepository,
						prUrl
					);
					reviewUrl = githubData.htmlUrl;
				} catch (error) {
					if (error instanceof GitHubServiceError) {
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message: error.message
						});
					}
					throw error;
				}
			}

			await ctx.db.pullRequestReview.update({
				where: { id: reviewId },
				data: {
					prUrl: reviewUrl,
					githubRepositoryId: githubData ? githubRepository?.id : null,
					githubPullRequestNumber: githubData?.number ?? null,
					githubTitle: githubData?.title ?? null,
					githubState: githubData?.state ?? null,
					githubAuthorLogin: githubData?.authorLogin ?? null,
					githubCommitCount: githubData?.commitCount ?? null,
					githubHeadSha: githubData?.headSha ?? null,
					githubChecksStatus: githubData?.checksStatus ?? null,
					githubLastSyncedAt: githubData ? new Date() : null
				}
			});

			return { success: true, message: 'PR review URL updated successfully' };
		})
};
