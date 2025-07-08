import { useParams } from 'next/navigation';
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import { api } from '~/trpc/react';

export const useSprintQueries = () => {
	const isTemplate = useIsTemplate();
	const params = useParams();
	const projectId = decodeURIComponent(params.id as string);

	const getAllSprints = () => {
		return api.sprint.getAllByProjectId.useQuery({
			projectId,
			isTemplate
		});
	};

	const getSprintById = (sprintId: string) => {
		return api.sprint.getById.useQuery({
			id: sprintId
		});
	};

	return {
		getAllSprints,
		getSprintById
	};
};
