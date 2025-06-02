import { toast } from 'sonner';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { api } from '~/trpc/react';

interface UseCommentsProps {
	taskId: string;
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
		onMutate: async ({ content }) => {
			await utils.comment.getByTaskId.cancel({ taskId });

			const previousComments = utils.comment.getByTaskId.getData({ taskId });

			if (user && previousComments) {
				const optimisticComment = {
					id: `temp-${Date.now()}`,
					content,
					createdAt: new Date(),
					updatedAt: new Date(),
					taskId,
					authorId: user.id,
					author: {
						id: user.id,
						name: user.fullName,
						email:
							user.primaryEmailAddress?.emailAddress ||
							user.emailAddresses[0]?.emailAddress ||
							''
					}
				};

				const newComments = [...previousComments, optimisticComment];
				utils.comment.getByTaskId.setData({ taskId }, newComments);
			}

			return { previousComments };
		},
		onError: (error, _variables, context) => {
			console.error('Failed to create comment:', error);

			if (context?.previousComments) {
				utils.comment.getByTaskId.setData({ taskId }, context.previousComments);
			}

			toast.error('Failed to add comment. Please try again.');
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

	return {
		comments,
		isLoading,
		error,
		addComment,
		isAddingComment: createCommentMutation.isPending
	};
}
