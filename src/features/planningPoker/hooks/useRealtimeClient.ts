'use client';

import {
	type PresenceMember as OnlineMember,
	usePusherPresence
} from '~/common/hooks/usePusherPresence';
import type { RealtimeCallbacks } from '~/server/realtime/types';

interface UseRealtimeClientProps {
	sessionId: string;
	callbacks: RealtimeCallbacks;
}

export type { OnlineMember };

const planningPokerEvents = [
	'vote',
	'task-finalized',
	'task-description-updated',
	'task-deleted',
	'session-ended'
] as const;

export function useRealtimeClient({
	sessionId,
	callbacks
}: UseRealtimeClientProps) {
	return usePusherPresence({
		channelName: sessionId ? `presence-planning-poker-${sessionId}` : '',
		eventNames: planningPokerEvents,
		callbacks
	});
}
