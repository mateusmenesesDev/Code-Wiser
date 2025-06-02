export const convertUndefinedToNull = <T extends object>(obj: T): T => {
	return {
		...obj,
		...Object.fromEntries(
			Object.entries(obj).map(([key, value]) => [
				key,
				value === undefined ? null : value
			])
		)
	} as T;
};

export const getStatusLabel = (status: string) => {
	switch (status) {
		case 'TODO':
			return 'To Do';
		case 'IN_PROGRESS':
			return 'In Progress';
		case 'IN_REVIEW':
			return 'Code Review';
		case 'DONE':
			return 'Done';
		default:
			return status;
	}
};
