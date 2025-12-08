import { auth } from '@clerk/nextjs/server';
import { db } from '~/server/db';
import { userHasAccessToProject } from '~/server/utils/auth';
import { setBroadcastFunction } from '~/server/api/routers/planningPoker/utils/sse';

// Simple in-memory store for SSE connections
// In production, consider using Redis or similar for multi-instance deployments
const sseClients = new Map<string, Set<ReadableStreamDefaultController>>();

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
			if (!sseClients.has(sessionId)) {
				sseClients.set(sessionId, new Set());
			}
			sseClients.get(sessionId)?.add(controller);

			// Send initial connection message
			const encoder = new TextEncoder();
			controller.enqueue(
				encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
			);

			// Handle client disconnect
			request.signal.addEventListener('abort', () => {
				sseClients.get(sessionId)?.delete(controller);
				if (sseClients.get(sessionId)?.size === 0) {
					sseClients.delete(sessionId);
				}
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

// Helper function to broadcast events to all clients in a session
export function broadcastToSession(
	sessionId: string,
	event: { type: string; data: unknown }
) {
	const clients = sseClients.get(sessionId);
	if (!clients || clients.size === 0) return;

	const encoder = new TextEncoder();
	const message = `data: ${JSON.stringify(event)}\n\n`;

	for (const controller of clients) {
		try {
			controller.enqueue(encoder.encode(message));
		} catch (error) {
			// Client disconnected, remove from set
			clients.delete(controller);
		}
	}

	// Clean up empty sets
	if (clients.size === 0) {
		sseClients.delete(sessionId);
	}
}

// Set up broadcast function for mutations to use
setBroadcastFunction(broadcastToSession);
