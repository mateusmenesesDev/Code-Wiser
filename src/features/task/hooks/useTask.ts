import { api } from '~/trpc/react';

export const useTask = () => {
	const { data: tasks } = api.task.getAll.useQuery();
};
