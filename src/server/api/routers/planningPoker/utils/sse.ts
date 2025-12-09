// Helper to broadcast SSE events
// This will be imported by mutations to send real-time updates

//TODO: Use Redis for scalable SSE connections
const sseClients = new Map<string, Set<ReadableStreamDefaultController>>();

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
		} catch {
			// Client disconnected, remove from set
			clients.delete(controller);
		}
	}

	// Clean up empty sets
	if (clients.size === 0) {
		sseClients.delete(sessionId);
	}
}

export function addSSEClient(
	sessionId: string,
	controller: ReadableStreamDefaultController
) {
	if (!sseClients.has(sessionId)) {
		sseClients.set(sessionId, new Set());
	}
	sseClients.get(sessionId)?.add(controller);
}

export function removeSSEClient(
	sessionId: string,
	controller: ReadableStreamDefaultController
) {
	const clients = sseClients.get(sessionId);
	if (clients) {
		clients.delete(controller);
		if (clients.size === 0) {
			sseClients.delete(sessionId);
		}
	}
}

export function broadcastEvent(
	sessionId: string,
	event: { type: string; data: unknown }
) {
	broadcastToSession(sessionId, event);
}
