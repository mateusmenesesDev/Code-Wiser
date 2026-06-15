'use client';

import { useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type {
	PlanningPokerStoryPoint,
	SSEMessage,
	VoteSSEData
} from '~/features/planningPoker/types/planningPoker.types';
import { formatPublicTaskId } from '~/lib/publicTaskId';
import { api } from '~/trpc/react';
import { useRealtimeClient } from './useRealtimeClient';

interface UsePlanningPokerProps {
	sessionId: string;
}

export function usePlanningPoker({ sessionId }: UsePlanningPokerProps) {
	const { user } = useUser();
	const userId = user?.id;
	const utils = api.useUtils();
	const [selectedValue, setSelectedValue] = useState<
		PlanningPokerStoryPoint | undefined
	>();
	const [allVoted, setAllVoted] = useState(false);
	const [showResults, setShowResults] = useState(false);
	const [finalStoryPoints, setFinalStoryPoints] = useState<number | null>(null);

	const { data: session, refetch: refetchSession } =
		api.planningPoker.getSession.useQuery(
			{ sessionId },
			{ enabled: !!sessionId }
		);

	const currentTaskId = session?.taskIds[session?.currentTaskIndex ?? 0] ?? '';

	const { data: votes, refetch: refetchVotes } =
		api.planningPoker.getSessionVotes.useQuery(
			{
				sessionId,
				taskId: currentTaskId
			},
			{
				enabled: !!session && !!currentTaskId && session.taskIds.length > 0,
				refetchInterval: false
			}
		);

	const voteMutation = api.planningPoker.vote.useMutation({
		onSuccess: () => {
			refetchVotes();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to vote');
		}
	});

	const changeVoteMutation = api.planningPoker.changeVote.useMutation({
		onSuccess: () => {
			refetchVotes();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to change vote');
		}
	});

	const finalizeTaskMutation = api.planningPoker.finalizeTask.useMutation({
		onSuccess: () => {
			setShowResults(false);
			setSelectedValue(undefined);
			setFinalStoryPoints(null);
			setAllVoted(false);
			setTimeout(() => {
				refetchSession();
				refetchVotes();
			}, 100);
		},
		onError: (error) => {
			const zodError = error.data?.zodError;
			let errorMessage = 'Failed to finalize task';

			if (zodError?.fieldErrors?.finalStoryPoints?.[0]) {
				errorMessage = zodError.fieldErrors.finalStoryPoints[0];
			} else if (error.message) {
				errorMessage = error.message;
			}

			toast.error(errorMessage);
		}
	});

	const endSessionMutation = api.planningPoker.endSession.useMutation({
		onSuccess: () => {
			toast.success('Session ended!');
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to end session');
		}
	});

	const { data: currentTaskData } = api.task.getById.useQuery(
		{ id: currentTaskId },
		{ enabled: !!currentTaskId && currentTaskId !== '' }
	);

	const currentTask = currentTaskData
		? {
				id: currentTaskData.id,
				publicTaskId: formatPublicTaskId(
					currentTaskData.project?.publicCode ??
						currentTaskData.projectTemplate?.publicCode,
					currentTaskData.publicNumber
				),
				title: currentTaskData.title,
				description: currentTaskData.description
			}
		: null;

	const currentTaskVotes = useMemo(
		() => votes?.filter((v) => v.taskId === currentTaskId) ?? [],
		[votes, currentTaskId]
	);

	useEffect(() => {
		if (currentTaskId && session) {
			setShowResults(false);
			setAllVoted(false);
			setSelectedValue(undefined);
			setFinalStoryPoints(null);
			const timeoutId = setTimeout(() => {
				refetchVotes();
			}, 100);

			return () => clearTimeout(timeoutId);
		}
	}, [currentTaskId, session, refetchVotes]);

	useEffect(() => {
		if (votes && userId && currentTaskId) {
			const currentTaskVotes = votes.filter((v) => v.taskId === currentTaskId);
			const userVote = currentTaskVotes.find((v) => v.userId === userId);
			if (userVote) {
				setSelectedValue(userVote.storyPoints as PlanningPokerStoryPoint);
			} else if (currentTaskId) {
				setSelectedValue(undefined);
			}
		}
	}, [votes, userId, currentTaskId]);

	const handleRealtimeEvent = useCallback(
		(event: SSEMessage) => {
			switch (event.type) {
				case 'vote': {
					const data = event.data as VoteSSEData;
					if (data.userId === userId && data.taskId === currentTaskId) {
						setSelectedValue(data.storyPoints);
					}
					refetchVotes();
					break;
				}
				case 'task-finalized': {
					setShowResults(false);
					setSelectedValue(undefined);
					setFinalStoryPoints(null);
					setAllVoted(false);

					void utils.planningPoker.getSession
						.invalidate({ sessionId })
						.then(() => {
							return refetchSession();
						});
					break;
				}
				case 'session-ended': {
					toast.success('Session ended!');
					refetchSession();
					break;
				}
			}
		},
		[userId, currentTaskId, refetchVotes, refetchSession, sessionId, utils]
	);

	const onConnected = useCallback(() => {}, []);

	const onDisconnected = useCallback(() => {}, []);

	const onError = useCallback(() => {}, []);

	const onEvent = useCallback(
		(event: { type: string; data: unknown }) => {
			handleRealtimeEvent(event as SSEMessage);
		},
		[handleRealtimeEvent]
	);

	const realtimeCallbacks = useMemo(
		() => ({
			onConnected,
			onDisconnected,
			onError,
			onEvent
		}),
		[onConnected, onDisconnected, onError, onEvent]
	);

	const { status: realtimeStatus, onlineMembers } = useRealtimeClient({
		sessionId,
		callbacks: realtimeCallbacks
	});

	const membersWithVoteStatus = useMemo(() => {
		const votedUserIds = new Set(currentTaskVotes.map((v) => v.userId));

		return onlineMembers.map((member) => ({
			...member,
			hasVoted: votedUserIds.has(member.id)
		}));
	}, [currentTaskVotes, onlineMembers]);

	useEffect(() => {
		if (!currentTaskId || onlineMembers.length === 0) {
			setAllVoted(false);
			setShowResults(false);
			return;
		}

		const votedUserIds = new Set(currentTaskVotes.map((v) => v.userId));
		const onlineMemberIds = new Set(onlineMembers.map((member) => member.id));
		const hasEveryOnlineMemberVoted = Array.from(onlineMemberIds).every((id) =>
			votedUserIds.has(id)
		);

		setAllVoted(hasEveryOnlineMemberVoted);
		setShowResults(hasEveryOnlineMemberVoted);
	}, [currentTaskVotes, currentTaskId, onlineMembers]);

	const handleVote = useCallback(
		(value: PlanningPokerStoryPoint) => {
			if (!sessionId) return;

			setSelectedValue(value);

			if (selectedValue === undefined) {
				voteMutation.mutate({
					sessionId,
					storyPoints: value
				});
			} else {
				changeVoteMutation.mutate({
					sessionId,
					storyPoints: value
				});
			}
		},
		[sessionId, selectedValue, voteMutation, changeVoteMutation]
	);

	const handleFinalizeTask = useCallback(() => {
		if (!sessionId) return;

		finalizeTaskMutation.mutate({
			sessionId,
			finalStoryPoints: finalStoryPoints ?? undefined
		});
	}, [sessionId, finalStoryPoints, finalizeTaskMutation]);

	const handleEndSession = useCallback(() => {
		if (!sessionId) return;

		endSessionMutation.mutate({ sessionId });
	}, [sessionId, endSessionMutation]);

	const isCreator = session?.createdById === userId;
	const isLastTask =
		(session?.currentTaskIndex ?? 0) >= (session?.taskIds.length ?? 0) - 1;

	return {
		session,
		currentTask,
		votes,
		members: membersWithVoteStatus,
		realtimeStatus,
		selectedValue,
		allVoted,
		showResults,
		finalStoryPoints,
		setFinalStoryPoints,
		handleVote,
		handleFinalizeTask,
		handleEndSession,
		isCreator,
		isLastTask,
		currentTaskIndex: session?.currentTaskIndex ?? 0,
		totalTasks: session?.taskIds.length ?? 0,
		isLoading: !session || !currentTask,
		isFinalizing: finalizeTaskMutation.isPending,
		isEnding: endSessionMutation.isPending
	};
}
