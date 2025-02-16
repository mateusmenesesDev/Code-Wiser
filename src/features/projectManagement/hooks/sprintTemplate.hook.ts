import { toast } from 'sonner';
import { api } from '~/trpc/react';

export const useSprintTemplate = (projectTemplateSlug: string) => {
	const utils = api.useUtils();
	const createSprintTemplate =
		api.projectTemplate.sprint.createSprint.useMutation({
			onMutate: async (newSprint) => {
				const newSprintWithPrismaFields = {
					...newSprint,
					createdAt: new Date(),
					updatedAt: new Date(),
					projectTemplateSlug: newSprint.projectSlug,
					description: newSprint.description || null,
					startDate: newSprint.startDate ? new Date(newSprint.startDate) : null,
					endDate: newSprint.endDate ? new Date(newSprint.endDate) : null,
					id: '',
					tasks: []
				};

				utils.projectTemplate.sprint.getAllSprints.cancel();
				const previousSprints =
					utils.projectTemplate.sprint.getAllSprints.getData({
						projectTemplateSlug: projectTemplateSlug
					});

				utils.projectTemplate.sprint.getAllSprints.setData(
					{ projectTemplateSlug: projectTemplateSlug },
					(old) => {
						if (!old) return [newSprintWithPrismaFields];
						return [...old, newSprintWithPrismaFields];
					}
				);

				return { previousSprints };
			},
			onSettled: () => {
				utils.projectTemplate.sprint.getAllSprints.invalidate();
			},
			onSuccess: () => {
				toast.success('Sprint template created successfully');
			},
			onError: (error, _newSprint, ctx) => {
				toast.error(error.message);
				utils.projectTemplate.sprint.getAllSprints.setData(
					{ projectTemplateSlug: projectTemplateSlug },
					ctx?.previousSprints
				);
			}
		});
	const getAllSprints = api.projectTemplate.sprint.getAllSprints.useQuery({
		projectTemplateSlug: projectTemplateSlug
	});

	return {
		createSprintTemplate,
		getAllSprints
	};
};
