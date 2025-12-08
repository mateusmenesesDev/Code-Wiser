import type { PlanningPokerSession, PlanningPokerVote } from '@prisma/client';

export type PlanningPokerStoryPoint = 1 | 2 | 3 | 5 | 8 | 13 | 21 | null;

export interface PlanningPokerSessionWithRelations
	extends PlanningPokerSession {
	project: {
		id: string;
		title: string;
	};
	createdBy: {
		id: string;
		name: string | null;
		email: string;
	};
	votes: PlanningPokerVoteWithRelations[];
}

export interface PlanningPokerVoteWithRelations extends PlanningPokerVote {
	user: {
		id: string;
		name: string | null;
		email: string;
	};
	task: {
		id: string;
		title: string;
		description: string | null;
	};
}

export interface SSEMessage {
	type: 'vote' | 'member-joined' | 'task-finalized' | 'session-ended';
	data: unknown;
}

export interface VoteSSEData {
	sessionId: string;
	taskId: string;
	userId: string;
	storyPoints: PlanningPokerStoryPoint;
}

export interface MemberJoinedSSEData {
	sessionId: string;
	userId: string;
	userName: string | null;
	userEmail: string;
}

export interface TaskFinalizedSSEData {
	sessionId: string;
	taskId: string;
	finalStoryPoints: number | null;
	nextTaskIndex: number;
}

export interface SessionEndedSSEData {
	sessionId: string;
}
