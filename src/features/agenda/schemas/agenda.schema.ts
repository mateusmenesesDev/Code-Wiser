import { z } from 'zod';

const calendarDateSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD')
	.refine((value) => {
		const date = new Date(`${value}T00:00:00.000Z`);
		return (
			date.getUTCFullYear() === Number(value.slice(0, 4)) &&
			date.getUTCMonth() + 1 === Number(value.slice(5, 7)) &&
			date.getUTCDate() === Number(value.slice(8, 10))
		);
	}, 'Date must be a valid calendar date');

export const agendaPeriodSchema = z.enum(['today', 'upcoming', 'overdue']);

export const getAgendaOverviewSchema = z.object({
	period: agendaPeriodSchema.default('today'),
	date: calendarDateSchema,
	projectId: z.string().optional(),
	sprintId: z.string().optional(),
	assigneeId: z.string().optional()
});

export const updateReminderPreferenceSchema = z.object({
	enabled: z.boolean()
});

export type AgendaPeriod = z.infer<typeof agendaPeriodSchema>;
