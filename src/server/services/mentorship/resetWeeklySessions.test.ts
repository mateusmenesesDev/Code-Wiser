import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';

vi.mock('~/server/db', () => ({
	db: mockDb
}));

describe('resetAllWeeklySessions', () => {
	beforeEach(() => {
		mockDb.$executeRaw.mockResolvedValue(3 as never);
	});

	it('resets active mentees with one set-based SQL update', async () => {
		const { resetAllWeeklySessions } = await import('./mentorshipService');

		const result = await resetAllWeeklySessions();

		expect(result).toEqual({ success: true, count: 3 });
		expect(mockDb.user.findMany).not.toHaveBeenCalled();
		expect(mockDb.user.update).not.toHaveBeenCalled();
		expect(mockDb.$executeRaw).toHaveBeenCalledTimes(1);
	});
});
