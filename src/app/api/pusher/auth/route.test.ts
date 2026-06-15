import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { POST } from './route';

const pusherAuth = vi.hoisted(() => ({
	authenticatePresenceChannel: vi.fn(),
	clerkSession: {
		userId: 'user-1',
		sessionClaims: { o: { rol: 'member' } },
		has: vi.fn(() => false)
	}
}));

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => pusherAuth.clerkSession
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/server/realtime', () => ({
	getRealtimeService: () => ({
		authenticatePresenceChannel: pusherAuth.authenticatePresenceChannel
	})
}));

const authRequest = (channelName: string) =>
	new Request('http://localhost/api/pusher/auth', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			socket_id: '123.456',
			channel_name: channelName
		})
	});

describe('POST /api/pusher/auth', () => {
	beforeEach(() => {
		pusherAuth.authenticatePresenceChannel.mockClear();
		pusherAuth.authenticatePresenceChannel.mockReturnValue({
			auth: 'signed-auth',
			channel_data: 'signed-user-data'
		});
	});

	it('authorizes only active planning poker presence channels with safe member data', async () => {
		mockDb.planningPokerSession.findUnique.mockResolvedValue({
			projectId: 'project-1',
			status: 'ACTIVE'
		} as never);
		mockDb.project.findUnique
			.mockResolvedValueOnce({ members: [{ id: 'user-1' }] } as never)
			.mockResolvedValueOnce({ canceledAt: null } as never);
		mockDb.user.findUnique.mockResolvedValue({
			id: 'user-1',
			name: 'Ada',
			email: 'ada@example.com'
		} as never);

		const response = await POST(
			authRequest('presence-planning-poker-session-1')
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			auth: 'signed-auth',
			channel_data: 'signed-user-data'
		});
		expect(pusherAuth.authenticatePresenceChannel).toHaveBeenCalledWith(
			'123.456',
			'presence-planning-poker-session-1',
			{
				user_id: 'user-1',
				user_info: {
					id: 'user-1',
					name: 'Ada',
					email: 'ada@example.com'
				}
			}
		);
	});

	it('rejects non-presence planning poker channels', async () => {
		const response = await POST(authRequest('planning-poker-session-1'));

		expect(response.status).toBe(403);
		expect(pusherAuth.authenticatePresenceChannel).not.toHaveBeenCalled();
	});
});
