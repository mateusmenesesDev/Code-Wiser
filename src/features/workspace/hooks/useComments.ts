import { useMutationState } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { api } from '~/trpc/react';
import type { CommentsApiOutput } from '../types/Comment.type';

interface UseCommentsProps {
	taskId: string;
}

interface CreateVariables {
	taskId: string;
	content: string;
}

interface UpdateVariables {
	id: string;
	content: string;
}

export function useComments({ taskId }: UseCommentsProps) {
	const utils = api.useUtils();
	const { user } = useAuth();

	const {
		data: comments = [],
		isLoading,
		error
	} = api.comment.getByTaskId.useQuery(
		{ taskId },
		{
			enabled: !!taskId
		}
	);

	const createCommentMutation = api.comment.create.useMutation({
		onMutate: async (variables) => {
			await utils.comment.getByTaskId.cancel({ taskId });
			const previousComments = utils.comment.getByTaskId.getData({ taskId });

			utils.comment.getByTaskId.setData({ taskId }, (old) => {
				if (!old) return [];
				const now = new Date();
				const optimisticComment: CommentsApiOutput[number] = {
					id: `optimistic-new-${Date.now()}`,
					taskId: variables.taskId,
					content: variables.content,
					createdAt: now,
					updatedAt: now,
					authorId: 'optimistic',
					author: {
						id: 'optimistic',
						name: user?.fullName || '',
						email: user?.emailAddresses[0]?.emailAddress || ''
					},
					authorImageUrl: user?.imageUrl || ''
				};
				return [optimisticComment, ...old];
			});

			return { previousComments };
		},
		onError: (error, _variables, context) => {
			if (context?.previousComments) {
				utils.comment.getByTaskId.setData({ taskId }, context.previousComments);
			}
			console.error('Failed to create comment:', error);
			toast.error('Failed to add comment. Please try again.');
		},
		onSettled: () => {
			void utils.comment.getByTaskId.invalidate({ taskId });
		}
	});

	const updateCommentMutation = api.comment.update.useMutation({
		onMutate: async (variables) => {
			await utils.comment.getByTaskId.cancel({ taskId });
			const previousComments = utils.comment.getByTaskId.getData({ taskId });

			utils.comment.getByTaskId.setData({ taskId }, (old) => {
				if (!old) return [];
				return old.map((comment) =>
					comment.id === variables.id
						? { ...comment, content: variables.content }
						: comment
				);
			});

			return { previousComments };
		},
		onError: (error, _variables, context) => {
			if (context?.previousComments) {
				utils.comment.getByTaskId.setData({ taskId }, context.previousComments);
			}
			console.error('Failed to update comment:', error);
			toast.error('Failed to update comment. Please try again.');
		},
		onSettled: () => {
			void utils.comment.getByTaskId.invalidate({ taskId });
		}
	});

	const deleteCommentMutation = api.comment.delete.useMutation({
		onMutate: async (variables) => {
			await utils.comment.getByTaskId.cancel({ taskId });
			const previousComments = utils.comment.getByTaskId.getData({ taskId });
			utils.comment.getByTaskId.setData({ taskId }, (old) =>
				old?.filter((comment) => comment.id !== variables.id)
			);
			return { previousComments };
		},
		onError: (error, _variables, context) => {
			if (context?.previousComments) {
				utils.comment.getByTaskId.setData({ taskId }, context.previousComments);
			}
			console.error('Failed to delete comment:', error);
			toast.error('Failed to delete comment. Please try again.');
		},
		onSettled: () => {
			void utils.comment.getByTaskId.invalidate({ taskId });
		}
	});

	const addComment = async (content: string) => {
		return createCommentMutation.mutateAsync({
			taskId,
			content
		});
	};

	const updateComment = async (id: string, content: string) => {
		return updateCommentMutation.mutateAsync({
			id,
			content
		});
	};

	const deleteComment = async (id: string) => {
		return deleteCommentMutation.mutateAsync({
			id
		});
	};

	const createVariables = useMutationState<CreateVariables>({
		filters: { mutationKey: ['comment', 'create'], status: 'pending' },
		select: (mutation) => {
			const variables = mutation.state.variables as CreateVariables;
			return variables;
		}
	});

	const updateVariables = useMutationState<UpdateVariables>({
		filters: { mutationKey: ['comment', 'update'], status: 'pending' },
		select: (mutation) => {
			const variables = mutation.state.variables as UpdateVariables;
			return variables;
		}
	});

	return {
		comments,
		isLoading,
		error,
		addComment,
		updateComment,
		deleteComment,
		createCommentMutation,
		updateCommentMutation,
		deleteCommentMutation,
		createVariables,
		updateVariables
	};
}
