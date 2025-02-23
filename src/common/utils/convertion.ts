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
