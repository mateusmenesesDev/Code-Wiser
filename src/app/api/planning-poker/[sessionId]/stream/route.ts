import { auth } from '@clerk/nextjs/server';
import { db } from '~/server/db';
import { userHasAccessToProject } from '~/server/utils/auth';
import {
	addSSEClient,
	removeSSEClient
} from '~/server/api/routers/planningPoker/utils/sse';

export async function GET(
	request: Request,
	{ params }: { params: { sessionId: string } }
) {
	const { sessionId } = params;

	if (!sessionId) {
		return new Response('Session ID required', { status: 400 });
	}

	const session = auth();
	if (!session.userId) {
		return new Response('Unauthorized', { status: 401 });
	}

	// Verify session exists and user has access
	const planningSession = await db.planningPokerSession.findUnique({
		where: { id: sessionId },
		select: {
			projectId: true,
			status: true
		}
	});

	if (!planningSession) {
		return new Response('Session not found', { status: 404 });
	}

	// Check access - need to check admin status
	const orgRole = (session.sessionClaims?.o as { rol?: string })?.rol;
	const isAdmin = orgRole === 'admin' || session.has({ role: 'org:admin' });

	const hasAccess = await userHasAccessToProject(
		{
			db,
			session: { userId: session.userId },
			isAdmin
		},
		planningSession.projectId
	);

	if (!hasAccess) {
		return new Response('Forbidden', { status: 403 });
	}

	// Create SSE stream
	const stream = new ReadableStream({
		start(controller) {
			// Add client to the set
			addSSEClient(sessionId, controller);

			// Send initial connection message
			const encoder = new TextEncoder();
			controller.enqueue(
				encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
			);

			// Handle client disconnect
			request.signal.addEventListener('abort', () => {
				removeSSEClient(sessionId, controller);
				controller.close();
			});
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no' // Disable nginx buffering
		}
	});
}
