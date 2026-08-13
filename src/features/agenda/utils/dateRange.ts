import type { AgendaPeriod } from '../schemas/agenda.schema';

export type AgendaDateRange = {
	from?: Date;
	to?: Date;
};

function addDays(date: Date, days: number) {
	const result = new Date(date);
	result.setUTCDate(result.getUTCDate() + days);
	return result;
}

export function getAgendaDateRange(
	period: AgendaPeriod,
	date: string
): AgendaDateRange {
	const start = new Date(`${date}T00:00:00.000Z`);
	const tomorrow = addDays(start, 1);

	switch (period) {
		case 'today':
			return { from: start, to: tomorrow };
		case 'upcoming':
			return { from: tomorrow, to: addDays(start, 8) };
		case 'overdue':
			return { to: start };
	}
}
