import { toast } from 'sonner';
import { api } from '~/trpc/react';

type UseSprintProps = {
	projectSlug: string;
	isTemplate: boolean;
};

export const useSprint = ({ projectSlug, isTemplate }: UseSprintProps) => {
	const utils = api.useUtils();

	const createSprint = api.sprint.create.useMutation({
		onMutate: async (newSprint) => {
			const newSprintWithPrismaFields = {
				...newSprint,
				createdAt: new Date(),
				updatedAt: new Date(),
				projectTemplateSlug: isTemplate
					? (newSprint.projectTemplateSlug ?? null)
					: null,
				projectSlug: isTemplate ? null : (newSprint.projectSlug ?? null),
				description: newSprint.description || null,
				startDate: newSprint.startDate ? new Date(newSprint.startDate) : null,
				endDate: newSprint.endDate ? new Date(newSprint.endDate) : null,
				id: '',
				tasks: []
			};
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

	return {
		createSprint,
		getAllSprints,
		deleteSprint
	};
};
