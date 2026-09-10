import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { getRealtimeService } from '~/server/realtime';
import {
	assertProjectIsActive,
	userHasAccessToProject
} from '~/server/utils/auth';

const PLANNING_POKER_PREFIX = 'presence-planning-poker-';
const RETROSPECTIVE_PREFIX = 'presence-retrospective-project-';

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
		return NextResponse.json(
			{ error: 'Invalid auth request' },
			{ status: 400 }
		);
	}

	let projectId: string | null = null;
	if (channelName.startsWith(PLANNING_POKER_PREFIX)) {
		const sessionId = channelName.slice(PLANNING_POKER_PREFIX.length);
		const pokerSession = await db.planningPokerSession.findUnique({
			where: { id: sessionId },
			select: { projectId: true, status: true }
		});

		if (!pokerSession || pokerSession.status !== 'ACTIVE') {
			return NextResponse.json({ error: 'Session not found' }, { status: 404 });
		}
		projectId = pokerSession.projectId;
	} else if (channelName.startsWith(RETROSPECTIVE_PREFIX)) {
		projectId = channelName.slice(RETROSPECTIVE_PREFIX.length);
		const project = await db.project.findUnique({
			where: { id: projectId },
			select: { id: true }
		});

		if (!project) {
			return NextResponse.json({ error: 'Project not found' }, { status: 404 });
		}
	} else {
		return NextResponse.json({ error: 'Invalid channel' }, { status: 403 });
	}

	if (!projectId) {
		return NextResponse.json({ error: 'Project not found' }, { status: 404 });
	}

	const orgRole = (session.sessionClaims?.o as OrganizationData | undefined)
		?.rol;
	const isAdmin = orgRole === 'admin' || session.has({ role: 'org:admin' });

	try {
		await userHasAccessToProject(
			{ db, session: { userId }, isAdmin },
			projectId
		);
		await assertProjectIsActive(db, projectId);
	} catch {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const user = await db.user.findUnique({
		where: { id: userId },
		select: { id: true, name: true, email: true }
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
