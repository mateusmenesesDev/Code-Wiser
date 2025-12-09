/**
 * Pusher implementation of IRealtimeService
 */

import Pusher from 'pusher';
import type { IRealtimeService } from './interface';
import type { RealtimeEvent } from './types';

export class PusherRealtimeService implements IRealtimeService {
	private pusher: Pusher;
	private clientKey: string;
	private cluster?: string;

	constructor(config: {
		appId: string;
		key: string;
		secret: string;
		cluster?: string;
	}) {
		this.clientKey = config.key;
		this.cluster = config.cluster;

		this.pusher = new Pusher({
			appId: config.appId,
			key: config.key,
			secret: config.secret,
			cluster: config.cluster || 'us2',
			useTLS: true
		});
	}

	async broadcast(channel: string, event: RealtimeEvent): Promise<void> {
		await this.trigger(channel, event.type, event.data);
	}

	async trigger(
		channel: string,
		eventName: string,
		data: unknown
	): Promise<void> {
		try {
			await this.pusher.trigger(channel, eventName, data);
		} catch (error) {
			console.error(`Pusher trigger error for channel ${channel}:`, error);
			throw error;
		}
	}

	getClientConfig(): {
		key: string;
		cluster?: string;
		host?: string;
		port?: number;
		encrypted?: boolean;
	} {
		return {
			key: this.clientKey,
			cluster: this.cluster,
			encrypted: true
		};
	}
}
