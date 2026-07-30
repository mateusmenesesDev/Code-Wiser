'use client';

import Pusher from 'pusher-js';
import { useEffect, useRef, useState } from 'react';
import { env } from '~/env';
import type { RealtimeCallbacks } from '~/server/realtime/types';

interface UseRealtimeClientProps {
	sessionId: string;
	callbacks: RealtimeCallbacks;
}

type ConnectionStatus =
	| 'connecting'
	| 'connected'
	| 'reconnecting'
	| 'disconnected';

export type OnlineMember = {
	id: string;
	name: string | null;
	email: string;
};

type PresenceMember = {
	id: string;
	info?: {
		id?: string;
		name?: string | null;
		email?: string;
	};
};

type PlanningPokerPresenceChannel = {
	members: {
		each(callback: (member: PresenceMember) => void): void;
	};
	bind<T = unknown>(eventName: string, callback: (data: T) => void): void;
	unbind_all(): void;
};

const toOnlineMember = (member: PresenceMember): OnlineMember | null => {
	const id = member.info?.id ?? member.id;
	const email = member.info?.email;

	if (!id || !email) return null;

	return {
		id,
		name: member.info?.name ?? null,
		email
	};
};

const sortMembers = (members: OnlineMember[]) =>
	[...members].sort((a, b) => {
		const aLabel = a.name ?? a.email;
		const bLabel = b.name ?? b.email;
		return aLabel.localeCompare(bLabel);
	});

export function useRealtimeClient({
	sessionId,
	callbacks
}: UseRealtimeClientProps) {
	const [status, setStatus] = useState<ConnectionStatus>('connecting');
	const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
	const pusherRef = useRef<Pusher | null>(null);
	const channelRef = useRef<string | null>(null);
	const callbacksRef = useRef(callbacks);
	const eventsBoundRef = useRef(false);
	const hasConnectedRef = useRef(false);

	useEffect(() => {
		callbacksRef.current = callbacks;
	}, [callbacks]);

	useEffect(() => {
		if (!sessionId) return;

		const channelName = `presence-planning-poker-${sessionId}`;

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
				forceTLS: true,
				channelAuthorization: {
					endpoint: '/api/pusher/auth',
					transport: 'ajax'
				}
			});
		}

		const pusher = pusherRef.current;

		if (!eventsBoundRef.current) {
			pusher.connection.bind('state_change', ({ current }: { current: string }) => {
				if (current === 'connected') {
					hasConnectedRef.current = true;
					setStatus('connected');
					callbacksRef.current.onConnected?.();
					return;
				}

				if (current === 'connecting') {
					setStatus(hasConnectedRef.current ? 'reconnecting' : 'connecting');
					return;
				}

				if (
					current === 'unavailable' ||
					current === 'failed' ||
					current === 'disconnected'
				) {
					setStatus('disconnected');
					setOnlineMembers([]);
					callbacksRef.current.onDisconnected?.();
				}
			});

			pusher.connection.bind('error', (error: Error) => {
				callbacksRef.current.onError?.(error);
			});
			eventsBoundRef.current = true;
		}

		const channel = pusher.subscribe(
			channelName
		) as unknown as PlanningPokerPresenceChannel;
		channelRef.current = channelName;

		channel.bind('pusher:subscription_succeeded', () => {
			const members: OnlineMember[] = [];
			channel.members.each((member: PresenceMember) => {
				const onlineMember = toOnlineMember(member);
				if (onlineMember) members.push(onlineMember);
			});
			setOnlineMembers(sortMembers(members));
		});

		channel.bind('pusher:subscription_error', (error: Error) => {
			setStatus('disconnected');
			setOnlineMembers([]);
			callbacksRef.current.onError?.(error);
		});

		channel.bind('pusher:member_added', (member: PresenceMember) => {
			const onlineMember = toOnlineMember(member);
			if (!onlineMember) return;

			setOnlineMembers((members) =>
				sortMembers([
					...members.filter((existing) => existing.id !== onlineMember.id),
					onlineMember
				])
			);
		});

		channel.bind('pusher:member_removed', (member: PresenceMember) => {
			setOnlineMembers((members) =>
				members.filter((existing) => existing.id !== member.id)
			);
		});

		channel.bind('vote', (data: unknown) => {
			callbacksRef.current.onEvent?.({
				type: 'vote',
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
				setOnlineMembers([]);
			}
		};
	}, [sessionId]);

	return { isConnected: status === 'connected', status, onlineMembers };
}
