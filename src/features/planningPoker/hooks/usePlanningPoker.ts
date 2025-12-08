'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '~/trpc/react';
import type {
	PlanningPokerStoryPoint,
	SSEMessage,
	VoteSSEData,
	MemberJoinedSSEData
} from '~/features/planningPoker/types/planningPoker.types';
import { toast } from 'sonner';

interface UsePlanningPokerProps {
	sessionId: string;
}

export function usePlanningPoker({ sessionId }: UsePlanningPokerProps) {
	const { user } = useUser();
	const userId = user?.id;
	const [selectedValue, setSelectedValue] = useState<
		PlanningPokerStoryPoint | undefined
	>();
	const [allVoted, setAllVoted] = useState(false);
	const [showResults, setShowResults] = useState(false);
	const eventSourceRef = useRef<EventSource | null>(null);
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
				refetchInterval: 2000 // Poll every 2 seconds as fallback
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
			// Reset state immediately
			setShowResults(false);
			setSelectedValue(undefined);
			setFinalStoryPoints(null);
			setAllVoted(false);
			// Refetch will happen via SSE event, but we do it here too as fallback
			setTimeout(() => {
				refetchSession();
				refetchVotes();
			}, 100);
		},
		onError: (error) => {
			// Extract error message from Zod validation error
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

	// Get current task - we need to fetch it separately
	const { data: currentTaskData } = api.task.getById.useQuery(
		{ id: currentTaskId },
		{ enabled: !!currentTaskId && currentTaskId !== '' }
	);

	const currentTask = currentTaskData
		? {
				id: currentTaskData.id,
				title: currentTaskData.title,
				description: currentTaskData.description
			}
		: null;

	// Get project members who have voted
	const projectMembers = api.project.getMembers.useQuery(
		{ projectId: session?.projectId ?? '' },
		{ enabled: !!session?.projectId }
	);

	// Calculate who has voted (only for current task)
	const currentTaskVotes =
		votes?.filter((v) => v.taskId === currentTaskId) ?? [];
	const votedUserIds = new Set(currentTaskVotes.map((v) => v.userId));
	const membersWithVoteStatus =
		projectMembers.data?.map((member) => ({
			...member,
			hasVoted: votedUserIds.has(member.id)
		})) ?? [];

	// Reset state when task changes
	useEffect(() => {
		if (currentTaskId) {
			// Reset all voting state when task changes
			setShowResults(false);
			setAllVoted(false);
			setSelectedValue(undefined);
			setFinalStoryPoints(null);
		}
	}, [currentTaskId]);

	// Check if all members voted (only for current task)
	useEffect(() => {
		if (
			projectMembers.data &&
			currentTaskVotes &&
			currentTaskId &&
			projectMembers.data.length > 0 &&
			currentTaskVotes.length >= projectMembers.data.length
		) {
			setAllVoted(true);
			setShowResults(true);
		} else {
			setAllVoted(false);
			// Don't show results if not all voted
			if (
				!currentTaskVotes ||
				currentTaskVotes.length < (projectMembers.data?.length ?? 0)
			) {
				setShowResults(false);
			}
		}
	}, [currentTaskVotes, projectMembers.data, currentTaskId]);

	// Get current user's vote (only for current task)
	useEffect(() => {
		if (votes && userId && currentTaskId) {
			// Filter votes to ensure they're for the current task
			const currentTaskVotes = votes.filter((v) => v.taskId === currentTaskId);
			const userVote = currentTaskVotes.find((v) => v.userId === userId);
			if (userVote) {
				setSelectedValue(userVote.storyPoints as PlanningPokerStoryPoint);
			} else if (currentTaskId) {
				// If user hasn't voted for current task, clear selection
				setSelectedValue(undefined);
			}
		}
	}, [votes, userId, currentTaskId]);

	// Setup SSE connection
	useEffect(() => {
		if (!sessionId) return;

		const eventSource = new EventSource(
			`/api/planning-poker/${sessionId}/stream`
		);

		eventSource.onmessage = (event) => {
			try {
				const message: SSEMessage = JSON.parse(event.data);

				switch (message.type) {
					case 'vote': {
						const data = message.data as VoteSSEData;
						if (data.userId === userId) {
							setSelectedValue(data.storyPoints);
						}
						refetchVotes();
						break;
					}
					case 'member-joined': {
						const data = message.data as MemberJoinedSSEData;
						toast.info(`${data.userName || data.userEmail} joined the session`);
						refetchSession();
						break;
					}
					case 'task-finalized': {
						// Reset state for next task
						setShowResults(false);
						setSelectedValue(undefined);
						setFinalStoryPoints(null);
						setAllVoted(false);
						// Refetch session and votes to get new task
						refetchSession();
						// Small delay to ensure session is updated before refetching votes
						setTimeout(() => {
							refetchVotes();
						}, 200);
						break;
					}
					case 'session-ended': {
						toast.success('Session ended!');
						refetchSession();
						break;
					}
				}
			} catch (error) {
				console.error('Error parsing SSE message:', error);
			}
		};

		eventSource.onerror = (error) => {
			console.error('SSE error:', error);
			// EventSource will automatically reconnect
		};

		eventSourceRef.current = eventSource;

		return () => {
			eventSource.close();
		};
	}, [sessionId, userId, refetchVotes, refetchSession]);

	// Join session on mount (only once)
	const joinSessionMutation = api.planningPoker.joinSession.useMutation({
		onError: (error) => {
			console.error('Failed to join session:', error);
		}
	});

	const hasJoinedRef = useRef(false);
	useEffect(() => {
		if (sessionId && userId && !hasJoinedRef.current) {
			hasJoinedRef.current = true;
			joinSessionMutation.mutate({ sessionId });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionId, userId, joinSessionMutation]);

	const handleVote = useCallback(
		(value: PlanningPokerStoryPoint) => {
			if (!sessionId) return;

			setSelectedValue(value);

			if (selectedValue === undefined) {
				// First vote
				voteMutation.mutate({
					sessionId,
					storyPoints: value
				});
			} else {
				// Change vote
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
