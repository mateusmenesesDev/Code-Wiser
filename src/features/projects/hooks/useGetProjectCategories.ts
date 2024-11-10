import { api } from '~/trpc/react';

export const useGetProjectCategories = ({
	approved
}: { approved: boolean }) => {
	const { data, isLoading } = api.projectBase.getCategories.useQuery({
		approved: approved
	});

	return { data, isLoading };
};
