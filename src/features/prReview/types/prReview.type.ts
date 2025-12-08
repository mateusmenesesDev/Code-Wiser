import type {
	PullRequestReview,
	PullRequestReviewStatusEnum,
	User
} from '@prisma/client';
import type { RouterOutputs } from '~/trpc/react';

export type PRReviewWithRelations = PullRequestReview & {
	reviewedBy: Pick<User, 'id' | 'name' | 'email'>;
	task: {
		id: string;
		title: string;
		prUrl: string | null;
		assignee: {
			id: string;
			name: string | null;
			email: string;
		} | null;
		project: {
			id: string;
			title: string;
		} | null;
	};
};

export type PRReviewApiOutput = RouterOutputs['prReview']['getAll'][number];
export type PRReviewByTaskApiOutput =
	RouterOutputs['prReview']['getByTaskId'][number];
export type ActivePRReviewApiOutput =
	RouterOutputs['prReview']['getActiveByTaskId'];

export type PRReviewStatus = PullRequestReviewStatusEnum;
