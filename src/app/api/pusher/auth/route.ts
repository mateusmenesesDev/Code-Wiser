import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { getRealtimeService } from '~/server/realtime';
import { assertProjectIsActive, userHasAccessToProject } from '~/server/utils/auth';

const PRESENCE_PREFIX = 'presence-planning-poker-';

type OrganizationData = {
	rol?: string;
};

export async function POST(request: Request) {
	const session = auth();
	const userId = session.userId;

	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const formData = await request.formData();
	const socketId = formData.get('socket_id');
	const channelName = formData.get('channel_name');

	if (typeof socketId !== 'string' || typeof channelName !== 'string') {
		return NextResponse.json({ error: 'Invalid auth request' }, { status: 400 });
	}

	if (!channelName.startsWith(PRESENCE_PREFIX)) {
		return NextResponse.json({ error: 'Invalid channel' }, { status: 403 });
	}

	const planningPokerSessionId = channelName.slice(PRESENCE_PREFIX.length);
	const pokerSession = await db.planningPokerSession.findUnique({
		where: { id: planningPokerSessionId },
		select: {
			projectId: true,
			status: true
		}
	});

	if (!pokerSession || pokerSession.status !== 'ACTIVE') {
		return NextResponse.json({ error: 'Session not found' }, { status: 404 });
	}

	const orgRole = (session.sessionClaims?.o as OrganizationData | undefined)?.rol;
	const isAdmin = orgRole === 'admin' || session.has({ role: 'org:admin' });

	try {
		await userHasAccessToProject(
			{ db, session: { userId }, isAdmin },
			pokerSession.projectId
		);
		await assertProjectIsActive(db, pokerSession.projectId);
	} catch {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			email: true
		}
	});

	if (!user) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 });
	}

	const authResponse = getRealtimeService().authenticatePresenceChannel(
		socketId,
		channelName,
		{
			user_id: user.id,
			user_info: {
				id: user.id,
				name: user.name,
				email: user.email
			}
		}
	);

	return NextResponse.json(authResponse);
}
