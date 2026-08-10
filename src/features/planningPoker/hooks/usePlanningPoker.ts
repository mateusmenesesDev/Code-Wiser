'use client';

import { useUser } from '@clerk/nextjs';
import { keepPreviousData } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type {
	PlanningPokerStoryPoint,
	SSEMessage,
	TaskFinalizedSSEData,
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
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [isSessionComplete, setIsSessionComplete] = useState(false);
	const previousTaskIdRef = useRef<string>('');

	const { data: session, refetch: refetchSession } =
		api.planningPoker.getSession.useQuery(
			{ sessionId },
			{ enabled: !!sessionId }
		);

	const currentTaskId = session?.taskIds[session?.currentTaskIndex ?? 0] ?? '';
	const nextTaskId =
		session?.taskIds[(session?.currentTaskIndex ?? 0) + 1] ?? null;

	useEffect(() => {
		if (!nextTaskId) return;

		void utils.task.getById.prefetch({ id: nextTaskId });
	}, [nextTaskId, utils.task.getById]);

	const { data: votes, refetch: refetchVotes } =
		api.planningPoker.getSessionVotes.useQuery(
			{
				sessionId,
				taskId: currentTaskId
			},
			{
				enabled: !!session && !!currentTaskId && session.taskIds.length > 0,
				refetchInterval: false,
				placeholderData: keepPreviousData
			}
		);

	const beginTaskTransition = useCallback(() => {
		if (isSessionComplete) return;
		setIsTransitioning(true);
	}, [isSessionComplete]);

	const beginSessionComplete = useCallback(() => {
		setIsTransitioning(false);
		setIsSessionComplete(true);
	}, []);

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
		onSuccess: (data) => {
			utils.planningPoker.getSession.setData({ sessionId }, (previous) => {
				if (!previous) return previous;

				return {
					...previous,
					currentTaskIndex: data.session.currentTaskIndex,
					status: data.session.status
				};
			});

			if (data.isLastTask) {
				beginSessionComplete();
			} else {
				beginTaskTransition();
			}

			void refetchSession();
		},
		onError: (error) => {
			setIsTransitioning(false);

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
			beginSessionComplete();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to end session');
		}
	});

	const {
		data: currentTaskData,
		isPlaceholderData: isTaskPlaceholder,
		isError: isTaskError,
		isFetching: isTaskFetching
	} = api.task.getById.useQuery(
		{ id: currentTaskId },
		{
			enabled: !!currentTaskId && currentTaskId !== '',
			placeholderData: keepPreviousData
		}
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

	const displayedTaskId = currentTask?.id ?? currentTaskId;

	const currentTaskVotes = useMemo(
		() => votes?.filter((v) => v.taskId === displayedTaskId) ?? [],
		[votes, displayedTaskId]
	);

	const displayTaskIndex = useMemo(() => {
		if (!session || !currentTask) {
			return session?.currentTaskIndex ?? 0;
		}

		const index = session.taskIds.indexOf(currentTask.id);
		return index >= 0 ? index : (session.currentTaskIndex ?? 0);
	}, [session, currentTask]);

	useEffect(() => {
		if (isSessionComplete) return;

		const previousTaskId = previousTaskIdRef.current;

		if (previousTaskId && currentTaskId && previousTaskId !== currentTaskId) {
			setIsTransitioning(true);
		}

		previousTaskIdRef.current = currentTaskId;
	}, [currentTaskId, isSessionComplete]);

	useEffect(() => {
		if (!isTransitioning || isSessionComplete) return;
		if (!currentTaskId || !currentTaskData) return;
		if (isTaskPlaceholder) return;
		if (currentTaskData.id !== currentTaskId) return;

		setShowResults(false);
		setSelectedValue(undefined);
		setFinalStoryPoints(null);
		setAllVoted(false);
		setIsTransitioning(false);
		void refetchVotes();
	}, [
		isTransitioning,
		isSessionComplete,
		currentTaskId,
		currentTaskData,
		isTaskPlaceholder,
		refetchVotes
	]);

	useEffect(() => {
		if (!isTransitioning || isSessionComplete) return;
		if (!isTaskError || isTaskFetching) return;

		setIsTransitioning(false);
		toast.error('Failed to load next story');
	}, [isTransitioning, isSessionComplete, isTaskError, isTaskFetching]);

	useEffect(() => {
		if (!isTransitioning || isSessionComplete) return;

		const timeoutId = setTimeout(() => {
			setIsTransitioning(false);
			toast.error('Timed out moving to the next story');
		}, 10_000);

		return () => clearTimeout(timeoutId);
	}, [isTransitioning, isSessionComplete]);

	useEffect(() => {
		if (isTransitioning || isSessionComplete) return;

		if (votes && userId && currentTaskId) {
			const votesForTask = votes.filter((v) => v.taskId === currentTaskId);
			const userVote = votesForTask.find((v) => v.userId === userId);
			if (userVote) {
				setSelectedValue(userVote.storyPoints as PlanningPokerStoryPoint);
			} else if (currentTaskId) {
				setSelectedValue(undefined);
			}
		}
	}, [votes, userId, currentTaskId, isTransitioning, isSessionComplete]);

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
					const data = event.data as TaskFinalizedSSEData;

					if (data.nextTaskIndex == null) {
						beginSessionComplete();
					} else {
						beginTaskTransition();
					}

					void utils.planningPoker.getSession
						.invalidate({ sessionId })
						.then(() => {
							return refetchSession();
						});
					break;
				}
				case 'session-ended': {
					beginSessionComplete();
					void refetchSession();
					break;
				}
			}
		},
		[
			userId,
			currentTaskId,
			refetchVotes,
			refetchSession,
			sessionId,
			utils,
			beginTaskTransition,
			beginSessionComplete
		]
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
		if (isTransitioning || isSessionComplete) return;

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
	}, [
		currentTaskVotes,
		currentTaskId,
		onlineMembers,
		isTransitioning,
		isSessionComplete
	]);

	const handleVote = useCallback(
		(value: PlanningPokerStoryPoint) => {
			if (!sessionId || isSessionComplete) return;

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
		[
			sessionId,
			selectedValue,
			voteMutation,
			changeVoteMutation,
			isSessionComplete
		]
	);

	const handleFinalizeTask = useCallback(() => {
		if (!sessionId || isSessionComplete) return;

		finalizeTaskMutation.mutate({
			sessionId,
			finalStoryPoints: finalStoryPoints ?? undefined
		});
	}, [sessionId, finalStoryPoints, finalizeTaskMutation, isSessionComplete]);

	const handleEndSession = useCallback(() => {
		if (!sessionId || isSessionComplete) return;

		endSessionMutation.mutate({ sessionId });
	}, [sessionId, endSessionMutation, isSessionComplete]);

	const isCreator = session?.createdById === userId;
	const isLastTask =
		displayTaskIndex >= (session?.taskIds.length ?? 0) - 1;

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
		currentTaskIndex: displayTaskIndex,
		totalTasks: session?.taskIds.length ?? 0,
		isLoading:
			!isSessionComplete && (!session || (!currentTask && !isTransitioning)),
		isTransitioning,
		isSessionComplete,
		isFinalizing:
			finalizeTaskMutation.isPending || isTransitioning || isSessionComplete,
		isEnding: endSessionMutation.isPending || isSessionComplete
	};
}
