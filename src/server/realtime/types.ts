/**
 * Types for real-time communication abstraction
 */

export interface RealtimeEvent {
	type: string;
	data: unknown;
}

export interface RealtimeClient {
	// Client-side methods
	connect(): void;
	disconnect(): void;
	subscribe(channel: string, callbacks: RealtimeCallbacks): void;
	unsubscribe(channel: string): void;
	isConnected(): boolean;
}

export interface RealtimeCallbacks {
	onEvent?: (event: RealtimeEvent) => void;
	onError?: (error: Error) => void;
	onConnected?: () => void;
	onDisconnected?: () => void;
}

export interface RealtimeServer {
	// Server-side methods
	broadcast(channel: string, event: RealtimeEvent): Promise<void>;
	trigger(channel: string, eventName: string, data: unknown): Promise<void>;
}

export interface RealtimeConfig {
	appId?: string;
	key: string;
	secret?: string;
	cluster?: string;
	host?: string;
	port?: number;
	encrypted?: boolean;
}
