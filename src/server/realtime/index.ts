/**
 * Real-time service factory and exports
 *
 * This module provides a unified interface for real-time communication using Pusher.
 * The abstraction allows for easy migration to other providers in the future if needed.
 */

import { env } from '~/env';
import type { IRealtimeService } from './interface';
import { PusherRealtimeService } from './pusher-adapter';

let realtimeServiceInstance: IRealtimeService | null = null;

/**
 * Get or create the real-time service instance
 */
export function getRealtimeService(): IRealtimeService {
	if (realtimeServiceInstance) {
		return realtimeServiceInstance;
	}

	realtimeServiceInstance = new PusherRealtimeService({
		appId: env.PUSHER_APP_ID,
		key: env.NEXT_PUBLIC_PUSHER_KEY,
		secret: env.PUSHER_SECRET,
		cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER
	});

	return realtimeServiceInstance;
}

// Export types and interfaces
export type { IRealtimeService } from './interface';
export type { RealtimeEvent, RealtimeClient, RealtimeCallbacks } from './types';
export { PusherRealtimeService } from './pusher-adapter';
