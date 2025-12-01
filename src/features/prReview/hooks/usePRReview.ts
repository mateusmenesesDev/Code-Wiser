import { toast } from 'sonner';
import { api } from '~/trpc/react';
import type {
	ApprovePRInput,
	CreatePRReviewInput,
	RequestChangesPRInput
} from '~/features/prReview/schemas/prReview.schema';
import type { z } from 'zod';
import type { updatePRReviewUrlSchema } from '~/features/prReview/schemas/prReview.schema';

export type UpdatePRReviewUrlInput = z.infer<typeof updatePRReviewUrlSchema>;

export interface RequestCodeReviewInput {
	taskId: string;
	prUrl: string;
}

export function usePRReview() {
	const utils = api.useUtils();

	const getAllReviews = api.prReview.getAll.useQuery;
	const getByTaskId = api.prReview.getByTaskId.useQuery;
	const getActiveByTaskId = api.prReview.getActiveByTaskId.useQuery;

	const createReviewMutation = api.prReview.requestCodeReview.useMutation({
		onSuccess: () => {
			toast.success('PR review created successfully');
			void utils.prReview.getAll.invalidate();
			void utils.prReview.getByTaskId.invalidate();
			void utils.prReview.getActiveByTaskId.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to create PR review');
		}
	});

	const approvePRMutation = api.prReview.approve.useMutation({
		onSuccess: () => {
			toast.success('PR approved successfully');
			void utils.prReview.getAll.invalidate();
			void utils.prReview.getByTaskId.invalidate();
			void utils.prReview.getActiveByTaskId.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to approve PR');
		}
	});

	const requestChangesMutation = api.prReview.requestChanges.useMutation({
		onSuccess: () => {
			toast.success('Changes requested');
			void utils.prReview.getAll.invalidate();
			void utils.prReview.getByTaskId.invalidate();
			void utils.prReview.getActiveByTaskId.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to request changes');
		}
	});

	const requestCodeReviewMutation = api.prReview.requestCodeReview.useMutation({
		onSuccess: () => {
			toast.success('Code review requested successfully');
			void utils.prReview.getAll.invalidate();
			void utils.prReview.getByTaskId.invalidate();
			void utils.prReview.getActiveByTaskId.invalidate();
			void utils.task.getById.invalidate();
			void utils.user.getCredits.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to request code review');
		}
	});

	const updatePRReviewUrlMutation = api.prReview.updatePRReviewUrl.useMutation({
		onSuccess: () => {
			toast.success('PR URL updated successfully');
			void utils.prReview.getAll.invalidate();
			void utils.prReview.getByTaskId.invalidate();
			void utils.prReview.getActiveByTaskId.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to update PR URL');
		}
	});

	const createReview = (input: CreatePRReviewInput) => {
		createReviewMutation.mutate(input);
	};

	const approvePR = (input: ApprovePRInput) => {
		approvePRMutation.mutate(input);
	};

	const requestChanges = (input: RequestChangesPRInput) => {
		requestChangesMutation.mutate(input);
	};

	const requestCodeReview = (input: RequestCodeReviewInput) => {
		requestCodeReviewMutation.mutate(input);
	};

	const updatePRReviewUrl = (input: UpdatePRReviewUrlInput) => {
		updatePRReviewUrlMutation.mutate(input);
	};

	return {
		getAllReviews,
		getByTaskId,
		getActiveByTaskId,
		createReview,
		approvePR,
		requestChanges,
		requestCodeReview,
		updatePRReviewUrl,
		isCreating: createReviewMutation.isPending,
		isApproving: approvePRMutation.isPending,
		isRequestingChanges: requestChangesMutation.isPending,
		isRequestingCodeReview: requestCodeReviewMutation.isPending,
		isUpdatingPRUrl: updatePRReviewUrlMutation.isPending
	};
}
