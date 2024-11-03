import { ProjectStatusEnum } from '@prisma/client';
import { toast } from 'sonner';
import { api } from '~/trpc/react';

export const useApproval = () => {
	const utils = api.useUtils();

	const changeProjectApprovalMutation =
		api.project.changeProjectApproval.useMutation({
			onSuccess: ({ title, status }) => {
				toast.success(
					status === ProjectStatusEnum.APPROVED
						? 'Project approved successfully'
						: 'Project rejected successfully'
				);
				utils.project.getAll.invalidate();
				utils.project.getByName.invalidate({ name: title });
			},
			onError: () => {
				toast.error('Error updating project approval');
			}
		});

	const changeTechnologyApprovalMutation =
		api.project.changeTechnologyApproval.useMutation({
			onSuccess: ({ approved }) => {
				toast.success(
					approved
						? 'Technology approved successfully'
						: 'Technology rejected successfully'
				);
				utils.project.getAll.invalidate();
				utils.project.getByName.invalidate();
			},
			onError: () => {
				toast.error('Error updating technology approval');
			}
		});

	const changeCategoryApprovalMutation =
		api.project.changeCategoryApproval.useMutation({
			onSuccess: ({ approved }) => {
				toast.success(
					approved
						? 'Category approved successfully'
						: 'Category rejected successfully'
				);
				utils.project.getAll.invalidate();
				utils.project.getByName.invalidate();
			},
			onError: () => {
				toast.error('Error updating category approval');
			}
		});

	const requestChangesMutation = api.project.requestChanges.useMutation({
		onSuccess: () => {
			toast.success('Changes requested successfully');
			utils.project.getAll.invalidate();
			utils.project.getByName.invalidate();
		},
		onError: () => {
			toast.error('Error requesting changes');
		}
	});

	return {
		changeProjectApprovalMutation,
		changeTechnologyApprovalMutation,
		changeCategoryApprovalMutation,
		requestChangesMutation
	};
};
