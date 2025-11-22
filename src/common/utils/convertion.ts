export const convertUndefinedToNull = <T extends object>(
	obj: T,
	preserveUndefinedFields: string[] = []
): T => {
	return {
		...obj,
		...Object.fromEntries(
			Object.entries(obj).map(([key, value]) => [
				key,
				preserveUndefinedFields.includes(key)
					? value
					: value === undefined
						? null
						: value
			])
		)
	} as T;
};

type NullToUndefined<T> = {
	[K in keyof T]: T[K] extends null
		? undefined
		: T[K] extends (infer U)[] | null
			? U[]
			: T[K] extends object | null
				? NullToUndefined<NonNullable<T[K]>>
				: T[K];
};

export const convertNullToUndefined = <T extends Record<string, unknown>>(
	obj: T,
	preserveNullFields: string[] = []
): NullToUndefined<T> => {
	const convertValue = (value: unknown): unknown => {
		if (value === null) return undefined;
		if (Array.isArray(value)) return value.length > 0 ? value : [];
		if (value instanceof Date) return value;
		if (typeof value === 'object' && value !== null) {
			return convertNullToUndefined(value as Record<string, unknown>);
		}
		return value;
	};

	const result = {
		...obj,
		...Object.fromEntries(
			Object.entries(obj).map(([key, value]) => [
				key,
				preserveNullFields.includes(key) ? value : convertValue(value)
			])
		)
	};

	return result as NullToUndefined<T>;
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

/**
 * Normalizes a date value from various input types to Date | undefined
 * Handles Date objects, date strings, timestamps, and undefined/null
 *
 * Note: Uses native Date constructor (not dayjs) since the schema expects Date objects.
 * Dayjs is used elsewhere for formatting and relative time, but not needed here.
 */
export const normalizeDate = (date: unknown): Date | undefined => {
	if (date instanceof Date) {
		return date;
	}
	if (date === null || date === undefined) {
		return undefined;
	}
	if (typeof date === 'string' || typeof date === 'number') {
		const dateObj = new Date(date);
		return Number.isNaN(dateObj.getTime()) ? undefined : dateObj;
	}
	return undefined;
};
