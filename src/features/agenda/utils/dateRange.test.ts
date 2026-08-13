import { describe, expect, it } from 'vitest';
import { getAgendaDateRange } from './dateRange';

describe('getAgendaDateRange', () => {
	it('returns the selected calendar day', () => {
		expect(getAgendaDateRange('today', '2026-08-13')).toEqual({
			from: new Date('2026-08-13T00:00:00.000Z'),
			to: new Date('2026-08-14T00:00:00.000Z')
		});
	});

	it('returns the seven days after today', () => {
		expect(getAgendaDateRange('upcoming', '2026-08-13')).toEqual({
			from: new Date('2026-08-14T00:00:00.000Z'),
			to: new Date('2026-08-21T00:00:00.000Z')
		});
	});

	it('returns everything before today for overdue tasks', () => {
		expect(getAgendaDateRange('overdue', '2026-08-13')).toEqual({
			to: new Date('2026-08-13T00:00:00.000Z')
		});
	});
});
