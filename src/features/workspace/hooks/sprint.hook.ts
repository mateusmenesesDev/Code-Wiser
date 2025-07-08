import { toast } from 'sonner';
import { api } from '~/trpc/react';
import type { NewSprint, UpdateSprint } from '../types/Sprint.type';

type UseSprintProps = {
	projectId: string;
	isTemplate: boolean;
};

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
		tasks: []
	};
};

export const useSprint = ({ projectId, isTemplate }: UseSprintProps) => {
	const utils = api.useUtils();

	const createSprint = api.sprint.create.useMutation({
		onMutate: async (newSprint) => {
			const newSprintWithPrismaFields = getPrismaFields(
				newSprint,
				isTemplate,
				projectId
			);

			const routeFunction = isTemplate
				? utils.sprint.getAllByProjectTemplateId
				: utils.sprint.getAllByProjectId;

			routeFunction.cancel();

			const previousSprints = routeFunction.getData({
				projectId
			});

			routeFunction.setData({ projectId }, (old) => {
				if (!old) return [newSprintWithPrismaFields];
				return [...old, newSprintWithPrismaFields];
			});

			return { previousSprints };
		},
		onSettled: () => {
			const routeFunction = isTemplate
				? utils.sprint.getAllByProjectTemplateId
				: utils.sprint.getAllByProjectId;

			routeFunction.invalidate();
		},
		onError: (error, _newSprint, ctx) => {
			const routeFunction = isTemplate
				? utils.sprint.getAllByProjectTemplateId
				: utils.sprint.getAllByProjectId;

			toast.error(error.message);
			routeFunction.setData({ projectId }, ctx?.previousSprints);
		}
	});

	const getAllSprints = () => {
		if (isTemplate) {
			return api.sprint.getAllByProjectTemplateId.useQuery({
				projectId
			});
		}

		return api.sprint.getAllByProjectId.useQuery({
			projectId
		});
	};

	const deleteSprint = api.sprint.delete.useMutation({
		onMutate: async ({ id }) => {
			const routeFunction = isTemplate
				? utils.sprint.getAllByProjectTemplateId
				: utils.sprint.getAllByProjectId;

			const previousSprints = routeFunction.getData({
				projectId
			});

			routeFunction.setData({ projectId }, (old) => {
				if (!old) return [];
				const newSprints = old.filter((s) => s.id !== id);
				return newSprints;
			});

			return { previousSprints };
		},
		onSuccess: () => {
			if (isTemplate) {
				utils.sprint.getAllByProjectTemplateId.invalidate();
			} else {
				utils.sprint.getAllByProjectId.invalidate();
			}
		},
		onError: (_err, _sprint, ctx) => {
			toast.error('Failed to delete sprint');
			utils.sprint.getAllByProjectId.setData(
				{ projectId },
				ctx?.previousSprints
			);
		}
	});

	const updateSprint = api.sprint.update.useMutation({
		onMutate: async (updatedSprint) => {
			const routeFunction = isTemplate
				? utils.sprint.getAllByProjectTemplateId
				: utils.sprint.getAllByProjectId;

			const previousSprints = routeFunction.getData({
				projectId
			});

			const updatedSprintWithPrismaFields = getPrismaFields(
				updatedSprint,
				isTemplate,
				projectId
			);

			routeFunction.setData({ projectId }, (old) => {
				if (!old) return [];
				return old.map((s) =>
					s.id === updatedSprint.id ? updatedSprintWithPrismaFields : s
				);
			});

			return { previousSprints };
		},
		onSettled: () => {
			const routeFunction = isTemplate
				? utils.sprint.getAllByProjectTemplateId
				: utils.sprint.getAllByProjectId;

			routeFunction.invalidate();
		},
		onError: (error, _updatedSprint, ctx) => {
			toast.error(error.message);
			utils.sprint.getAllByProjectId.setData(
				{ projectId },
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
