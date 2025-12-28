'use client';

import Pusher from 'pusher-js';
import { useEffect, useRef, useState } from 'react';
import { env } from '~/env';
import type { RealtimeCallbacks } from '~/server/realtime/types';

interface UseRealtimeClientProps {
	sessionId: string;
	callbacks: RealtimeCallbacks;
}

export function useRealtimeClient({
	sessionId,
	callbacks
}: UseRealtimeClientProps) {
	const [isConnected, setIsConnected] = useState(false);
	const pusherRef = useRef<Pusher | null>(null);
	const channelRef = useRef<string | null>(null);
	const callbacksRef = useRef(callbacks);
	const eventsBoundRef = useRef(false);

	useEffect(() => {
		callbacksRef.current = callbacks;
	}, [callbacks]);

	useEffect(() => {
		if (!sessionId) return;

		const channelName = `planning-poker-${sessionId}`;

		if (pusherRef.current) {
			if (channelRef.current === channelName) {
				const existingChannel = pusherRef.current.channel(channelName);
				if (existingChannel) {
					return;
				}
			}
			if (channelRef.current && channelRef.current !== channelName) {
				const prevChannel = pusherRef.current.channel(channelRef.current);
				if (prevChannel) {
					prevChannel.unbind_all();
					pusherRef.current.unsubscribe(channelRef.current);
				}
			}
		} else {
			pusherRef.current = new Pusher(env.NEXT_PUBLIC_PUSHER_KEY, {
				cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
				forceTLS: true
			});
		}

		const pusher = pusherRef.current;

		if (!eventsBoundRef.current) {
			pusher.connection.bind('connected', () => {
				setIsConnected(true);
				callbacksRef.current.onConnected?.();
			});

			pusher.connection.bind('disconnected', () => {
				setIsConnected(false);
				callbacksRef.current.onDisconnected?.();
			});

			pusher.connection.bind('error', (error: Error) => {
				callbacksRef.current.onError?.(error);
			});
			eventsBoundRef.current = true;
		}

		const channel = pusher.subscribe(channelName);
		channelRef.current = channelName;

		channel.bind('vote', (data: unknown) => {
			callbacksRef.current.onEvent?.({
				type: 'vote',
				data
			});
		});

		channel.bind('member-joined', (data: unknown) => {
			callbacksRef.current.onEvent?.({
				type: 'member-joined',
				data
			});
		});

		channel.bind('task-finalized', (data: unknown) => {
			callbacksRef.current.onEvent?.({
				type: 'task-finalized',
				data
			});
		});

		channel.bind('session-ended', (data: unknown) => {
			callbacksRef.current.onEvent?.({
				type: 'session-ended',
				data
			});
		});

		return () => {
			if (channel && pusherRef.current) {
				channel.unbind_all();
				pusherRef.current.unsubscribe(channelName);
			}
		};
	}, [sessionId]);

	return { isConnected };
}
