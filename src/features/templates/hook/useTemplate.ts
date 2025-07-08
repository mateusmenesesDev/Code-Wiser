import { EpicStatusEnum } from '@prisma/client';
import { type RouterOutputs, api } from '~/trpc/react';

type getEpicsOutput = RouterOutputs['projectTemplate']['epic']['getEpics'][0];

export const useTemplate = () => {
	const utils = api.useUtils();

	const createEpic = api.projectTemplate.epic.createEpic.useMutation({
		onMutate: async (newEpic) => {
			utils.projectTemplate.epic.getEpics.cancel();

			const prevData = utils.projectTemplate.epic.getEpics.getData(
				newEpic.projectTemplateId
			);

			if (!newEpic.projectTemplateId) {
				throw new Error('Project template ID is required');
			}

			utils.projectTemplate.epic.getEpics.setData(
				newEpic.projectTemplateId,
				(old) => {
					const completedNewEpic: getEpicsOutput = {
						...newEpic,
						id: crypto.randomUUID(),
						description: newEpic.description ?? null,
						createdAt: new Date(),
						updatedAt: new Date(),
						progress: 0,
						projectId: null,
						startDate: null,
						endDate: null,
						tasks: [],
						status: EpicStatusEnum.PLANNED,
						projectTemplateId: newEpic.projectTemplateId ?? ''
					};
					if (!old) return [completedNewEpic];

					return [...old, completedNewEpic];
				}
			);

			return { prevData };
		},
		onError: (_error, newEpic, context) => {
			if (!newEpic.projectTemplateId) {
				throw new Error('Project template ID is required');
			}

			utils.projectTemplate.epic.getEpics.setData(
				newEpic.projectTemplateId,
				context?.prevData
			);
		},
		onSettled: (newEpic) => {
			utils.projectTemplate.epic.getEpics.invalidate(
				newEpic?.projectTemplateId ?? ''
			);
		}
	});

	const getEpics = ({ templateId }: { templateId: string }) =>
		api.projectTemplate.epic.getEpics.useQuery(templateId);

	return {
		createEpic,
		getEpics
	};
};
