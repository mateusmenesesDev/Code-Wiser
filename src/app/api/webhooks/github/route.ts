import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '~/server/db';
import {
	GitHubServiceError,
	verifyGitHubWebhookSignature
} from '~/server/services/github/github';

const webhookPayloadSchema = z.object({
	action: z.string().optional(),
	installation: z.object({ id: z.number() }).optional(),
	repository: z.object({ full_name: z.string() }).optional(),
	pull_request: z
		.object({
			number: z.number(),
			html_url: z.string(),
			title: z.string(),
			state: z.string(),
			merged: z.boolean().optional(),
			user: z.object({ login: z.string() }).nullable().optional(),
			commits: z.number().optional(),
			head: z.object({ sha: z.string() })
		})
		.optional(),
	check_run: z
		.object({
			head_sha: z.string(),
			status: z.string(),
			conclusion: z.string().nullable().optional()
		})
		.optional(),
	repositories_removed: z.array(z.object({ full_name: z.string() })).optional()
});

function checksStatus(
	status: string,
	conclusion: string | null | undefined
): string {
	if (status !== 'completed') return 'PENDING';
	return [
		'failure',
		'cancelled',
		'timed_out',
		'action_required',
		'stale'
	].includes(conclusion ?? '')
		? 'FAILURE'
		: 'SUCCESS';
}

export async function POST(request: Request) {
	const rawBody = await request.text();
	try {
		if (
			!verifyGitHubWebhookSignature(
				rawBody,
				request.headers.get('x-hub-signature-256')
			)
		) {
			return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
		}
	} catch (error) {
		if (error instanceof GitHubServiceError) {
			return NextResponse.json(
				{ error: 'GitHub webhook is not configured' },
				{ status: 503 }
			);
		}
		throw error;
	}

	const deliveryId = request.headers.get('x-github-delivery');
	const eventName = request.headers.get('x-github-event');
	if (!deliveryId || !eventName) {
		return NextResponse.json(
			{ error: 'Missing GitHub webhook headers' },
			{ status: 400 }
		);
	}

	let payload: z.infer<typeof webhookPayloadSchema>;
	try {
		payload = webhookPayloadSchema.parse(JSON.parse(rawBody));
	} catch {
		return NextResponse.json(
			{ error: 'Invalid webhook payload' },
			{ status: 400 }
		);
	}

	const existing = await db.gitHubWebhookEvent.findUnique({
		where: { id: deliveryId },
		select: { id: true }
	});
	if (existing) return NextResponse.json({ received: true, duplicate: true });

	try {
		await db.$transaction(async (tx) => {
			const installationId = payload.installation?.id
				? String(payload.installation.id)
				: null;
			const repository =
				installationId && payload.repository?.full_name
					? await tx.gitHubRepository.findFirst({
							where: {
								fullName: payload.repository.full_name,
								installation: { githubInstallationId: installationId }
							},
							select: { id: true }
						})
					: null;

			if (eventName === 'pull_request' && repository && payload.pull_request) {
				const pullRequest = payload.pull_request;
				await tx.pullRequestReview.updateMany({
					where: {
						githubRepositoryId: repository.id,
						githubPullRequestNumber: pullRequest.number
					},
					data: {
						prUrl: pullRequest.html_url,
						githubTitle: pullRequest.title,
						githubState: pullRequest.merged
							? 'MERGED'
							: pullRequest.state.toUpperCase(),
						githubAuthorLogin: pullRequest.user?.login ?? null,
						githubCommitCount: pullRequest.commits ?? null,
						githubHeadSha: pullRequest.head.sha,
						githubLastSyncedAt: new Date(),
						...(payload.action === 'synchronize'
							? { githubChecksStatus: 'PENDING' }
							: {})
					}
				});
				await tx.exerciseReviewSubmission.updateMany({
					where: {
						githubRepositoryId: repository.id,
						githubPullRequestNumber: pullRequest.number
					},
					data: {
						prUrl: pullRequest.html_url,
						githubTitle: pullRequest.title,
						githubState: pullRequest.merged
							? 'MERGED'
							: pullRequest.state.toUpperCase(),
						githubAuthorLogin: pullRequest.user?.login ?? null,
						githubCommitCount: pullRequest.commits ?? null,
						githubHeadSha: pullRequest.head.sha,
						githubLastSyncedAt: new Date(),
						...(payload.action === 'synchronize'
							? { githubChecksStatus: 'PENDING' }
							: {})
					}
				});
			}

			if (eventName === 'check_run' && repository && payload.check_run) {
				const status = checksStatus(
					payload.check_run.status,
					payload.check_run.conclusion
				);
				await tx.pullRequestReview.updateMany({
					where: {
						githubRepositoryId: repository.id,
						githubHeadSha: payload.check_run.head_sha
					},
					data: { githubChecksStatus: status, githubLastSyncedAt: new Date() }
				});
				await tx.exerciseReviewSubmission.updateMany({
					where: {
						githubRepositoryId: repository.id,
						githubHeadSha: payload.check_run.head_sha
					},
					data: { githubChecksStatus: status, githubLastSyncedAt: new Date() }
				});
			}

			if (
				(eventName === 'installation' ||
					eventName === 'installation_repositories') &&
				installationId
			) {
				if (payload.action === 'deleted' || payload.action === 'suspend') {
					await tx.gitHubInstallation.updateMany({
						where: { githubInstallationId: installationId },
						data: { active: false }
					});
				}
				if (
					eventName === 'installation_repositories' &&
					payload.repositories_removed
				) {
					await tx.gitHubRepository.deleteMany({
						where: {
							fullName: {
								in: payload.repositories_removed.map((item) => item.full_name)
							},
							installation: { githubInstallationId: installationId }
						}
					});
				}
			}

			await tx.gitHubWebhookEvent.create({
				data: {
					id: deliveryId,
					event: eventName,
					action: payload.action ?? null,
					repositoryFullName: payload.repository?.full_name ?? null
				}
			});
		});
	} catch (error) {
		console.error('Failed to process GitHub webhook:', error);
		return NextResponse.json(
			{ error: 'Webhook processing failed' },
			{ status: 500 }
		);
	}

	return NextResponse.json({ received: true });
}
