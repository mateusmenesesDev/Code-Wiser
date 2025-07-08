import { useCallback } from 'react';
import { toast } from 'sonner';
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import { api } from '~/trpc/react';
import type { NewSprint, UpdateSprint } from '../types/Sprint.type';

const getPrismaFields = (
	sprint: NewSprint | UpdateSprint,
	isTemplate: boolean,
	projectId: string
) => {
	return {
		...sprint,
		title: sprint.title || '',
		createdAt: new Date(),
		updatedAt: new Date(),
		projectTemplateId: isTemplate ? projectId : null,
		projectId: isTemplate ? null : projectId,
		description: sprint.description || null,
		startDate: sprint.startDate ? new Date(sprint.startDate) : null,
		endDate: sprint.endDate ? new Date(sprint.endDate) : null,
		id: '',
		order: 0,
		tasks: []
	};
};

export const useSprint = ({ projectId }: { projectId: string }) => {
	const utils = api.useUtils();
	const isTemplate = useIsTemplate();

	const invalidateSprints = useCallback(() => {
		utils.sprint.getAllByProjectId.invalidate({
			projectId,
			isTemplate
		});
	}, [projectId, isTemplate, utils]);

	const createSprint = api.sprint.create.useMutation({
		onMutate: async (newSprint) => {
			const newSprintWithPrismaFields = getPrismaFields(
				newSprint,
				isTemplate,
				projectId
			);

			const previousSprints = utils.sprint.getAllByProjectId.getData({
				projectId,
				isTemplate
			});

			utils.sprint.getAllByProjectId.setData(
				{ projectId, isTemplate },
				(old) => {
					if (!old) return [newSprintWithPrismaFields];
					return [...old, newSprintWithPrismaFields];
				}
			);

			return { previousSprints };
		},
		onSettled: () => {
			invalidateSprints();
		},
		onError: (error, _newSprint, ctx) => {
			toast.error(error.message);
			utils.sprint.getAllByProjectId.setData(
				{ projectId, isTemplate },
				ctx?.previousSprints
			);
		}
	});

	const getAllSprints = () => {
		return api.sprint.getAllByProjectId.useQuery({
			projectId,
			isTemplate
		});
	};

	const deleteSprint = api.sprint.delete.useMutation({
		onMutate: async ({ id }) => {
			const previousSprints = utils.sprint.getAllByProjectId.getData({
				projectId,
				isTemplate
			});

			utils.sprint.getAllByProjectId.setData(
				{ projectId, isTemplate },
				(old) => {
					if (!old) return [];
					const newSprints = old.filter((s) => s.id !== id);
					return newSprints;
				}
			);

			return { previousSprints };
		},
		onSuccess: () => {
			invalidateSprints();
		},
		onError: (_err, _sprint, ctx) => {
			toast.error('Failed to delete sprint');
			utils.sprint.getAllByProjectId.setData(
				{ projectId, isTemplate },
				ctx?.previousSprints
			);
		}
	});

	const updateSprint = api.sprint.update.useMutation({
		onMutate: async (updatedSprint) => {
			const previousSprints = utils.sprint.getAllByProjectId.getData({
				projectId,
				isTemplate
			});

			const updatedSprintWithPrismaFields = getPrismaFields(
				updatedSprint,
				isTemplate,
				projectId
			);

			utils.sprint.getAllByProjectId.setData(
				{ projectId, isTemplate },
				(old) => {
					if (!old) return [];
					return old.map((s) =>
						s.id === updatedSprint.id ? updatedSprintWithPrismaFields : s
					);
				}
			);

			return { previousSprints };
		},
		onSettled: () => {
			invalidateSprints();
		},
		onError: (error, _updatedSprint, ctx) => {
			toast.error(error.message);
			utils.sprint.getAllByProjectId.setData(
				{ projectId, isTemplate },
				ctx?.previousSprints
			);
		}
	});

	return {
		createSprint,
		getAllSprints,
		deleteSprint,
		updateSprint
	};
};
