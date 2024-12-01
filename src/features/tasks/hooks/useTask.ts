import { api } from '~/trpc/react';

export function useTask() {
	const utils = api.useUtils();

	const createTask = api.task.create.useMutation({
		onSuccess: () => {
			utils.task.invalidate();
		}
	});

	return { createTask };
}
