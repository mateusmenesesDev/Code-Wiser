import { describe, expect, it } from 'vitest';
import {
	extractSlotsByDate,
	slotEntryToIsoStart
} from './calcomSlotsResponse';

describe('extractSlotsByDate', () => {
	it('reads date keys from data when slots are at top level (current v2)', () => {
		const raw = extractSlotsByDate({
			status: 'success',
			data: {
				'2050-09-05': [{ start: '2050-09-05T09:00:00.000Z' }]
			}
		});
		expect(raw['2050-09-05']).toEqual([{ start: '2050-09-05T09:00:00.000Z' }]);
	});

	it('reads nested data.slots (legacy shape)', () => {
		const raw = extractSlotsByDate({
			data: {
				slots: {
					'2050-09-05': [{ time: '2050-09-05T10:00:00.000Z' }]
				}
			}
		});
		expect(raw['2050-09-05']).toEqual([{ time: '2050-09-05T10:00:00.000Z' }]);
	});
});

describe('slotEntryToIsoStart', () => {
	it('prefers start then time', () => {
		expect(slotEntryToIsoStart({ start: 'a', time: 'b' })).toBe('a');
		expect(slotEntryToIsoStart({ time: 'b' })).toBe('b');
		expect(slotEntryToIsoStart('plain')).toBe('plain');
		expect(slotEntryToIsoStart({})).toBe(null);
	});
});
