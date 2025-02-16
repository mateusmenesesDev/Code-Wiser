import { toast } from 'sonner';
import { api } from '~/trpc/react';

export const useSprintTemplate = (projectTemplateSlug: string) => {
	const utils = api.useUtils();
	const createSprintTemplate = api.sprint.create.useMutation({
		onMutate: async (newSprint) => {
			const newSprintWithPrismaFields = {
				...newSprint,
				createdAt: new Date(),
				updatedAt: new Date(),
				projectTemplateSlug: newSprint.projectTemplateSlug || null,
				projectSlug: newSprint.projectSlug || null,
				description: newSprint.description || null,
				startDate: newSprint.startDate ? new Date(newSprint.startDate) : null,
				endDate: newSprint.endDate ? new Date(newSprint.endDate) : null,
				id: '',
				tasks: []
			};

			utils.sprint.getAllByProjectTemplateSlug.cancel();
			const previousSprints = utils.sprint.getAllByProjectTemplateSlug.getData({
				projectTemplateSlug: projectTemplateSlug
			});

			utils.sprint.getAllByProjectTemplateSlug.setData(
				{ projectTemplateSlug: projectTemplateSlug },
				(old) => {
					if (!old) return [newSprintWithPrismaFields];
					return [...old, newSprintWithPrismaFields];
				}
			);

			return { previousSprints };
		},
		onSettled: () => {
			utils.sprint.getAllByProjectTemplateSlug.invalidate();
		},
		onSuccess: () => {
			toast.success('Sprint template created successfully');
		},
		onError: (error, _newSprint, ctx) => {
			toast.error(error.message);
			utils.sprint.getAllByProjectTemplateSlug.setData(
				{ projectTemplateSlug: projectTemplateSlug },
				ctx?.previousSprints
			);
		}
	});
	const getAllSprints = api.sprint.getAllByProjectTemplateSlug.useQuery({
		projectTemplateSlug: projectTemplateSlug
	});

	return {
		createSprintTemplate,
		getAllSprints
	};
};
