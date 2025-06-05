import { ProjectStatusEnum } from '@prisma/client';
import { toast } from 'sonner';
import { api } from '~/trpc/react';

export const useApproval = () => {
	const utils = api.useUtils();

	const changeProjectApprovalMutation =
		api.projectTemplate.updateStatus.useMutation({
			onSuccess: async ({ slug, status }) => {
				toast.success(
					status === ProjectStatusEnum.APPROVED
						? 'Project approved successfully'
						: 'Project rejected successfully'
				);
				await utils.projectTemplate.getAll.invalidate();
				await utils.projectTemplate.getBySlug.invalidate({ slug });
			},
			onError: () => {
				toast.error('Error updating project approval');
			}
		});

	const changeTechnologyApprovalMutation =
		api.projectBase.changeTechnologyApproval.useMutation({
			onSuccess: ({ approved }) => {
				toast.success(
					approved
						? 'Technology approved successfully'
						: 'Technology rejected successfully'
				);
				utils.projectTemplate.getAll.invalidate();
				utils.projectTemplate.getBySlug.invalidate();
			},
			onError: () => {
				toast.error('Error updating technology approval');
			}
		});

	const changeCategoryApprovalMutation =
		api.projectBase.changeCategoryApproval.useMutation({
			onSuccess: ({ approved }) => {
				toast.success(
					approved
						? 'Category approved successfully'
						: 'Category rejected successfully'
				);
				utils.projectTemplate.getAll.invalidate();
				utils.projectTemplate.getBySlug.invalidate();
			},
			onError: () => {
				toast.error('Error updating category approval');
			}
		});

	const requestChangesMutation = api.projectTemplate.requestChanges.useMutation(
		{
			onSuccess: () => {
				toast.success('Changes requested successfully');
				utils.projectTemplate.getAll.invalidate();
				utils.projectTemplate.getBySlug.invalidate();
			},
			onError: () => {
				toast.error('Error requesting changes');
			}
		}
	);

	return {
		changeProjectApprovalMutation,
		changeTechnologyApprovalMutation,
		changeCategoryApprovalMutation,
		requestChangesMutation
	};
};
