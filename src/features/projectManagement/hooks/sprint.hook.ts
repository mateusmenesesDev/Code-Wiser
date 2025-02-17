import { toast } from 'sonner';
import { api } from '~/trpc/react';
import type { NewSprint, UpdateSprint } from '../types/Sprint.type';

type UseSprintProps = {
	projectSlug: string;
	isTemplate: boolean;
};

const getPrismaFields = (
	sprint: NewSprint | UpdateSprint,
	isTemplate: boolean,
	projectSlug: string
) => {
	return {
		...sprint,
		title: sprint.title || '',
		createdAt: new Date(),
		updatedAt: new Date(),
		projectTemplateSlug: isTemplate ? projectSlug : null,
		projectSlug: isTemplate ? null : projectSlug,
		description: sprint.description || null,
		startDate: sprint.startDate ? new Date(sprint.startDate) : null,
		endDate: sprint.endDate ? new Date(sprint.endDate) : null,
		id: '',
		tasks: []
	};
};

export const useSprint = ({ projectSlug, isTemplate }: UseSprintProps) => {
	const utils = api.useUtils();

	const createSprint = api.sprint.create.useMutation({
		onMutate: async (newSprint) => {
			const newSprintWithPrismaFields = getPrismaFields(
				newSprint,
				isTemplate,
				projectSlug
			);

			const routeFunction = isTemplate
				? utils.sprint.getAllByProjectTemplateSlug
				: utils.sprint.getAllByProjectSlug;

			routeFunction.cancel();

			const previousSprints = routeFunction.getData({
				projectTemplateSlug: projectSlug
			});

			routeFunction.setData({ projectTemplateSlug: projectSlug }, (old) => {
				if (!old) return [newSprintWithPrismaFields];
				return [...old, newSprintWithPrismaFields];
			});

			return { previousSprints };
		},
		onSettled: () => {
			const routeFunction = isTemplate
				? utils.sprint.getAllByProjectTemplateSlug
				: utils.sprint.getAllByProjectSlug;

			routeFunction.invalidate();
		},
		onError: (error, _newSprint, ctx) => {
			const routeFunction = isTemplate
				? utils.sprint.getAllByProjectTemplateSlug
				: utils.sprint.getAllByProjectSlug;

			toast.error(error.message);
			routeFunction.setData(
				{ projectTemplateSlug: projectSlug },
				ctx?.previousSprints
			);
		}
	});

	const getAllSprints = () => {
		if (isTemplate) {
			return api.sprint.getAllByProjectTemplateSlug.useQuery({
				projectTemplateSlug: projectSlug
			});
		}

		return api.sprint.getAllByProjectSlug.useQuery({
			projectSlug: projectSlug
		});
	};

	const deleteSprint = api.sprint.delete.useMutation({
		onMutate: async ({ id }) => {
			const routeFunction = isTemplate
				? utils.sprint.getAllByProjectTemplateSlug
				: utils.sprint.getAllByProjectSlug;

			const previousSprints = routeFunction.getData({
				projectTemplateSlug: projectSlug
			});

			routeFunction.setData({ projectTemplateSlug: projectSlug }, (old) => {
				if (!old) return [];
				const newSprints = old.filter((s) => s.id !== id);
				return newSprints;
			});

			return { previousSprints };
		},
		onSuccess: () => {
			if (isTemplate) {
				utils.sprint.getAllByProjectTemplateSlug.invalidate();
			} else {
				utils.sprint.getAllByProjectSlug.invalidate();
			}
		},
		onError: (_err, _sprint, ctx) => {
			toast.error('Failed to delete sprint');
			utils.sprint.getAllByProjectSlug.setData(
				{ projectSlug: projectSlug },
				ctx?.previousSprints
			);
		}
	});

	const updateSprint = api.sprint.update.useMutation({
		onMutate: async (updatedSprint) => {
			const routeFunction = isTemplate
				? utils.sprint.getAllByProjectTemplateSlug
				: utils.sprint.getAllByProjectSlug;

			const previousSprints = routeFunction.getData({
				projectTemplateSlug: projectSlug
			});

			const updatedSprintWithPrismaFields = getPrismaFields(
				updatedSprint,
				isTemplate,
				projectSlug
			);

			routeFunction.setData({ projectTemplateSlug: projectSlug }, (old) => {
				if (!old) return [];
				return old.map((s) =>
					s.id === updatedSprint.id ? updatedSprintWithPrismaFields : s
				);
			});

			return { previousSprints };
		},
		onSettled: () => {
			const routeFunction = isTemplate
				? utils.sprint.getAllByProjectTemplateSlug
				: utils.sprint.getAllByProjectSlug;

			routeFunction.invalidate();
		},
		onError: (error, _updatedSprint, ctx) => {
			toast.error(error.message);
			utils.sprint.getAllByProjectSlug.setData(
				{ projectSlug: projectSlug },
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
