import { api } from '~/trpc/react';

export const useGetProjectCategories = ({
	approved
}: { approved: boolean }) => {
	const { data, isLoading } = api.project.getCategories.useQuery({
		approved: approved
	});

	return { data, isLoading };
};
