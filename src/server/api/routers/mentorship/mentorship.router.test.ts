import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { mentorshipRouter } from './mentorship';

const authState = vi.hoisted(() => ({
	userId: 'learner-1' as string | null,
	isAdmin: false
}));

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: authState.userId,
		sessionClaims: authState.isAdmin ? { o: { rol: 'admin' } } : null,
		sessionId: authState.userId ? 'session-1' : null,
		getToken: () => Promise.resolve(authState.userId ? 'token' : null),
		has: ({ role }: { role: string }) =>
			authState.isAdmin && role === 'org:admin'
	})
}));

vi.mock('~/env', () => ({
	env: {
		CALCOM_API_KEY: 'test-key',
		CALCOM_EVENT_TYPE_ID: 'event-type-1'
	}
}));
vi.mock('~/server/db', () => ({ db: mockDb }));
vi.mock('~/server/realtime', () => ({ getRealtimeService: () => ({}) }));

describe('mentorship history', () => {
	const createCaller = createCallerFactory(mentorshipRouter);

	beforeEach(() => {
		authState.userId = 'learner-1';
		authState.isAdmin = false;
		mockDb.mentorshipBooking.findMany.mockResolvedValue([]);
		mockDb.mentorshipBooking.findUnique.mockResolvedValue({
			id: 'booking-1'
		} as never);
		mockDb.mentorshipBooking.update.mockResolvedValue({
			id: 'booking-1'
		} as never);
	});

	it('returns a bounded learner-safe history projection without requiring active mentorship', async () => {
		const scheduledAt = new Date('2026-08-20T12:00:00.000Z');
		mockDb.mentorshipBooking.findMany.mockResolvedValue([
			{
				id: 'booking-1',
				scheduledAt,
				status: 'COMPLETED',
				bookingUrl: null,
				meetingUrl: null,
				objective: 'Understand recursive descent parsing',
				followUp: 'Implement the parser tests',
				sessionNotes: 'Reviewed token boundaries',
				actionDueAt: new Date('2026-08-27T12:00:00.000Z'),
				actionStatus: 'PENDING'
			}
		] as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);
		const result = await caller.getMyBookings();

		expect(result[0]).toMatchObject({
			id: 'booking-1',
			objective: 'Understand recursive descent parsing',
			sessionNotes: 'Reviewed token boundaries',
			followUp: 'Implement the parser tests',
			actionStatus: 'PENDING'
		});
		expect(mockDb.mentorshipBooking.findMany).toHaveBeenCalledWith({
			where: { userId: 'learner-1' },
			orderBy: [{ scheduledAt: 'desc' }, { id: 'desc' }],
			take: 100,
			select: expect.objectContaining({
				objective: true,
				sessionNotes: true,
				followUp: true,
				actionStatus: true
			})
		});
		expect(result[0]).not.toHaveProperty('mentorPrivateNote');
	});

	it('stores shared notes, private notes, action tracking, and status for admins', async () => {
		authState.userId = 'admin-1';
		authState.isAdmin = true;
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.updateSessionNotes({
			bookingId: '11111111-1111-4111-8111-111111111111',
			objective: '  Define the next milestone  ',
			sessionNotes: '  Discussed the implementation trade-offs  ',
			mentorPrivateNote: '  Needs more confidence with testing  ',
			followUp: '  Add integration tests  ',
			actionDueAt: '2026-08-27T12:00:00.000Z',
			actionStatus: 'PENDING',
			status: 'COMPLETED'
		});

		expect(mockDb.mentorshipBooking.update).toHaveBeenCalledWith({
			where: { id: '11111111-1111-4111-8111-111111111111' },
			data: {
				objective: 'Define the next milestone',
				sessionNotes: 'Discussed the implementation trade-offs',
				mentorPrivateNote: 'Needs more confidence with testing',
				followUp: 'Add integration tests',
				actionDueAt: new Date('2026-08-27T12:00:00.000Z'),
				actionStatus: 'PENDING',
				status: 'COMPLETED'
			}
		});
	});

	it('does not allow action metadata without an agreed action', async () => {
		authState.userId = 'admin-1';
		authState.isAdmin = true;
		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			caller.updateSessionNotes({
				bookingId: '11111111-1111-4111-8111-111111111111',
				objective: null,
				sessionNotes: null,
				mentorPrivateNote: null,
				followUp: null,
				actionDueAt: '2026-08-27T12:00:00.000Z',
				actionStatus: 'PENDING'
			})
		).rejects.toMatchObject({ code: 'BAD_REQUEST' });
		expect(mockDb.mentorshipBooking.update).not.toHaveBeenCalled();
	});
});
