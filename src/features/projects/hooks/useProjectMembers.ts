import { useParams } from 'next/navigation';
import { api } from '~/trpc/react';

export const useProjectMembers = () => {
	const params = useParams();
	const projectId = params.id as string;

	const { data: members, isLoading } = api.project.getMembers.useQuery({
		projectId: projectId
	});

	return {
		members,
		isLoading
	};
};
