import { TaskPriorityEnum, TaskStatusEnum, TaskTypeEnum } from '@prisma/client';
import { z } from 'zod';

/** Allowed task story point values (planning poker / Fibonacci). */
export const FIBONACCI_STORY_POINTS = [1, 2, 3, 5, 8, 13, 21] as const;

/** Radix / DOM often send `""` for cleared selects; coerce so nativeEnum does not fail. */
const preprocessEmptyToUndefined = <S extends z.ZodTypeAny>(schema: S) =>
	z.preprocess(
		(val: unknown) => (val === '' || val === null ? undefined : val),
		schema
	) as z.ZodType<z.infer<S>>;

const storyPointsSchema = z.preprocess((val: unknown) => {
	if (val === '' || val === null || val === undefined) return undefined;
	if (typeof val === 'string') {
		const n = Number.parseInt(val.trim(), 10);
		return Number.isNaN(n) ? undefined : n;
	}
	if (typeof val === 'number') {
		return Number.isNaN(val) ? undefined : val;
	}
	return undefined;
}, z.number().optional().refine(
	(n) =>
		n === undefined ||
		(FIBONACCI_STORY_POINTS as readonly number[]).includes(n),
	{
		message:
			'Story points must be a Fibonacci value: 1, 2, 3, 5, 8, 13, or 21'
	}
)) as z.ZodType<number | undefined>;

export const baseTaskSchema = z.object({
	id: z.string().optional(),
	projectId: z.string(),
	title: z.string().min(1, { message: 'Title is required' }),
	description: z.string().optional(),
	type: preprocessEmptyToUndefined(z.nativeEnum(TaskTypeEnum).optional()),
	priority: preprocessEmptyToUndefined(
		z.nativeEnum(TaskPriorityEnum).optional()
	),
	tags: z.array(z.string()).optional(),
	epicId: z.string().nullable().optional(),
	sprintId: z.string().nullable().optional(),
	blocked: z.boolean().optional(),
	blockedReason: z.string().optional(),
	assigneeId: z.string().nullable().optional(),
	status: preprocessEmptyToUndefined(z.nativeEnum(TaskStatusEnum).optional()),
	order: z.number().optional(),
	storyPoints: storyPointsSchema,
	dueDate: z.coerce.date().optional()
});

export const createTaskSchema = baseTaskSchema
	.omit({ id: true })
	.extend({ isTemplate: z.boolean() });

export const updateTaskSchema = baseTaskSchema
	.partial()
	.extend({ isTemplate: z.boolean() })
	.refine((data) => data.id, {
		message: 'Id is required',
		path: ['id']
	});
