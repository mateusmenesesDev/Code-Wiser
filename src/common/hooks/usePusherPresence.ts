'use client';

import Pusher from 'pusher-js';
import { useEffect, useRef, useState } from 'react';
import { env } from '~/env';
import type { RealtimeCallbacks } from '~/server/realtime/types';

export type PresenceMember = {
	id: string;
	name: string | null;
	email: string;
};

type ConnectionStatus =
	| 'connecting'
	| 'connected'
	| 'reconnecting'
	| 'disconnected';

type PusherPresenceMember = {
	id: string;
	info?: {
		id?: string;
		name?: string | null;
		email?: string;
	};
};

type PusherPresenceChannel = {
	members: {
		each(callback: (member: PusherPresenceMember) => void): void;
	};
	bind<T = unknown>(eventName: string, callback: (data: T) => void): void;
	unbind_all(): void;
};

interface UsePusherPresenceProps {
	channelName: string;
	eventNames: readonly string[];
	callbacks: RealtimeCallbacks;
}

const toPresenceMember = (
	member: PusherPresenceMember
): PresenceMember | null => {
	const id = member.info?.id ?? member.id;
	const email = member.info?.email;

	if (!id || !email) return null;

	return {
		id,
		name: member.info?.name ?? null,
		email
	};
};

const sortMembers = (members: PresenceMember[]) =>
	[...members].sort((a, b) => {
		const aLabel = a.name ?? a.email;
		const bLabel = b.name ?? b.email;
		return aLabel.localeCompare(bLabel);
	});

export function usePusherPresence({
	channelName,
	eventNames,
	callbacks
}: UsePusherPresenceProps) {
	const [status, setStatus] = useState<ConnectionStatus>('connecting');
	const [onlineMembers, setOnlineMembers] = useState<PresenceMember[]>([]);
	const pusherRef = useRef<Pusher | null>(null);
	const callbacksRef = useRef(callbacks);
	const connectionEventsBoundRef = useRef(false);
	const hasConnectedRef = useRef(false);

	useEffect(() => {
		callbacksRef.current = callbacks;
	}, [callbacks]);

	useEffect(() => {
		if (!channelName) return;

		if (!pusherRef.current) {
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
		if (!connectionEventsBoundRef.current) {
			pusher.connection.bind(
				'state_change',
				({ current }: { current: string }) => {
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
				}
			);
			pusher.connection.bind('error', (error: Error) => {
				callbacksRef.current.onError?.(error);
			});
			connectionEventsBoundRef.current = true;
		}

		const channel = pusher.subscribe(
			channelName
		) as unknown as PusherPresenceChannel;

		channel.bind('pusher:subscription_succeeded', () => {
			const members: PresenceMember[] = [];
			channel.members.each((member) => {
				const onlineMember = toPresenceMember(member);
				if (onlineMember) members.push(onlineMember);
			});
			setOnlineMembers(sortMembers(members));
		});

		channel.bind('pusher:subscription_error', (error: Error) => {
			setStatus('disconnected');
			setOnlineMembers([]);
			callbacksRef.current.onError?.(error);
		});

		channel.bind('pusher:member_added', (member: PusherPresenceMember) => {
			const onlineMember = toPresenceMember(member);
			if (!onlineMember) return;

			setOnlineMembers((members) =>
				sortMembers([
					...members.filter((existing) => existing.id !== onlineMember.id),
					onlineMember
				])
			);
		});

		channel.bind('pusher:member_removed', (member: PusherPresenceMember) => {
			setOnlineMembers((members) =>
				members.filter((existing) => existing.id !== member.id)
			);
		});

		for (const eventName of eventNames) {
			channel.bind(eventName, (data: unknown) => {
				callbacksRef.current.onEvent?.({ type: eventName, data });
			});
		}

		return () => {
			channel.unbind_all();
			pusher.unsubscribe(channelName);
			setOnlineMembers([]);
		};
	}, [channelName, eventNames]);

	return {
		status,
		isConnected: status === 'connected',
		onlineMembers
	};
}
