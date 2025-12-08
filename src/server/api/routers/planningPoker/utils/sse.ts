// Helper to broadcast SSE events
// This will be imported by mutations to send real-time updates

let broadcastFunction:
	| ((sessionId: string, event: { type: string; data: unknown }) => void)
	| null = null;

export function setBroadcastFunction(
	fn: (sessionId: string, event: { type: string; data: unknown }) => void
) {
	broadcastFunction = fn;
}

export function broadcastEvent(
	sessionId: string,
	event: { type: string; data: unknown }
) {
	if (broadcastFunction) {
		broadcastFunction(sessionId, event);
	}
}
