import { useCallback } from 'react';
import { toast } from 'sonner';
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import { api } from '~/trpc/react';
import type { EpicInput, EpicUpdateInput } from '../types/Epic.type';

const getPrismaFields = (
	epic: EpicInput | EpicUpdateInput,
	isTemplate: boolean,
	projectId: string
) => {
	return {
		...epic,
		title: epic.title || '',
		createdAt: new Date(),
		updatedAt: new Date(),
		projectTemplateId: isTemplate ? projectId : null,
		projectId: isTemplate ? null : projectId,
		description: epic.description || null,
		status: null,
		progress: null,
		startDate: null,
		endDate: null,
		id: '',
		tasks: []
	};
};

export const useEpicMutations = ({ projectId }: { projectId: string }) => {
	const utils = api.useUtils();
	const isTemplate = useIsTemplate();

	const invalidateEpics = useCallback(() => {
		utils.epic.getAllByProjectId.invalidate({
			projectId,
			isTemplate
		});
	}, [projectId, isTemplate, utils]);

	const createEpic = api.epic.create.useMutation({
		onMutate: async (newEpic) => {
			const newEpicWithPrismaFields = getPrismaFields(
				newEpic,
				isTemplate,
				projectId
			);

			const previousEpics = utils.epic.getAllByProjectId.getData({
				projectId,
				isTemplate
			});

			utils.epic.getAllByProjectId.setData({ projectId, isTemplate }, (old) => {
				if (!old) return [newEpicWithPrismaFields];
				return [...old, newEpicWithPrismaFields];
			});

			return { previousEpics };
		},
		onSettled: () => {
			invalidateEpics();
		},
		onSuccess: () => {
			toast.success('Epic created successfully');
		},
		onError: (error, _newEpic, ctx) => {
			toast.error(error.message);
			utils.epic.getAllByProjectId.setData(
				{ projectId, isTemplate },
				ctx?.previousEpics
			);
		}
	});

	const updateEpic = api.epic.update.useMutation({
		onMutate: async (updatedEpic) => {
			const previousEpics = utils.epic.getAllByProjectId.getData({
				projectId,
				isTemplate
			});

			const updatedEpicWithPrismaFields = getPrismaFields(
				updatedEpic,
				isTemplate,
				projectId
			);

			utils.epic.getAllByProjectId.setData({ projectId, isTemplate }, (old) => {
				if (!old) return [];
				return old.map((e) =>
					e.id === updatedEpic.id
						? { ...updatedEpicWithPrismaFields, id: updatedEpic.id || '' }
						: e
				);
			});

			return { previousEpics };
		},
		onSettled: () => {
			invalidateEpics();
		},
		onSuccess: () => {
			toast.success('Epic updated successfully');
		},
		onError: (error, _updatedEpic, ctx) => {
			toast.error(error.message);
			utils.epic.getAllByProjectId.setData(
				{ projectId, isTemplate },
				ctx?.previousEpics
			);
		}
	});

	const deleteEpic = api.epic.delete.useMutation({
		onMutate: async ({ id }) => {
			const previousEpics = utils.epic.getAllByProjectId.getData({
				projectId,
				isTemplate
			});

			utils.epic.getAllByProjectId.setData({ projectId, isTemplate }, (old) => {
				if (!old) return [];
				return old.filter((e) => e.id !== id);
			});

			return { previousEpics };
		},
		onSuccess: () => {
			invalidateEpics();
			toast.success('Epic deleted successfully');
		},
		onError: (_error, _deleteInput, ctx) => {
			toast.error('Failed to delete epic');
			utils.epic.getAllByProjectId.setData(
				{ projectId, isTemplate },
				ctx?.previousEpics
			);
		}
	});

	return {
		createEpic,
		updateEpic,
		deleteEpic
	};
};
