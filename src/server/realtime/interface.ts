/**
 * Real-time communication service interface
 *
 * This interface abstracts the real-time communication layer,
 * allowing easy migration to other providers in the future if needed
 */

import type { RealtimeEvent, RealtimeServer } from './types';

export interface IRealtimeService extends RealtimeServer {
	/**
	 * Broadcast an event to all clients in a channel/session
	 */
	broadcast(channel: string, event: RealtimeEvent): Promise<void>;

	/**
	 * Trigger a specific event on a channel
	 */
	trigger(channel: string, eventName: string, data: unknown): Promise<void>;

	/**
	 * Get the client configuration needed for client-side connection
	 */
	getClientConfig(): {
		key: string;
		cluster?: string;
		host?: string;
		port?: number;
		encrypted?: boolean;
	};
}
