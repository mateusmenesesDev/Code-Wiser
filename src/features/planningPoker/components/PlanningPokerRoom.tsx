'use client';

import { Protect, useUser } from '@clerk/nextjs';
import { useSetAtom } from 'jotai';
import { Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '~/common/components/ui/button';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import { planningPokerDialogAtom } from '../atoms/planningPokerDialog.atom';
import { usePlanningPoker } from '../hooks/usePlanningPoker';
import type { PlanningPokerStoryPoint } from '../types/planningPoker.types';
import { EndSessionDialog } from './EndSessionDialog';
import { FinalizeLastTaskDialog } from './FinalizeLastTaskDialog';
import { MemberList } from './MemberList';
import { TaskCard } from './TaskCard';
import { VoteResults } from './VoteResults';
import { VotingCards } from './VotingCards';

interface PlanningPokerRoomProps {
	sessionId: string;
}

export function PlanningPokerRoom({ sessionId }: PlanningPokerRoomProps) {
	const router = useRouter();
	const { user } = useUser();
	const userId = user?.id;
	const setDialogState = useSetAtom(planningPokerDialogAtom);
	const {
		session,
		currentTask,
		votes,
		members,
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
		currentTaskIndex,
		totalTasks,
		isLoading,
		isFinalizing,
		isEnding
	} = usePlanningPoker({ sessionId });

	const handleEndSessionClick = () => {
		setDialogState((prev) => ({
			...prev,
			isEndSessionDialogOpen: true
		}));
	};

	const handleEndSessionConfirm = () => {
		handleEndSession();
		router.push(`/workspace/${session?.projectId}`);
	};

	const handleFinalizeLastTaskClick = () => {
		setDialogState((prev) => ({
			...prev,
			isFinalizeLastTaskDialogOpen: true
		}));
	};

	const handleFinalizeLastTaskConfirm = () => {
		handleFinalizeTask();
		// After finalizing, end the session
		handleEndSession();
		router.push(`/workspace/${session?.projectId}`);
	};

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<Loader2 className="h-8 w-8 animate-spin" />
					<p className="text-muted-foreground text-sm">Loading session...</p>
				</div>
			</div>
		);
	}

	if (!session || !currentTask) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<h2 className="mb-2 font-semibold text-xl">Session not found</h2>
					<Button onClick={() => router.back()}>Go Back</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col">
			{/* Header */}
			<div className="border-b bg-card p-4">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-bold text-2xl">Planning Poker</h1>
						<p className="text-muted-foreground text-sm">
							{session.project.title}
						</p>
					</div>
					{/* biome-ignore lint/a11y/useValidAriaRole: <explanation> */}
					<Protect role="org:admin">
						{isCreator && (
							<Button
								variant="destructive"
								size="sm"
								onClick={handleEndSessionClick}
								disabled={isEnding}
							>
								{isEnding ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Ending...
									</>
								) : (
									<>
										<LogOut className="mr-2 h-4 w-4" />
										End Session
									</>
								)}
							</Button>
						)}
					</Protect>
				</div>
			</div>

			<div className="flex flex-1 overflow-hidden">
				{/* Main Content */}
				<div className="flex-1 overflow-y-auto p-6">
					<div className="mx-auto max-w-4xl space-y-6">
						{/* Progress */}
						<div className="text-center">
							<p className="text-muted-foreground text-sm">
								Task {currentTaskIndex + 1} of {totalTasks}
							</p>
						</div>

						{/* Task Card */}
						<TaskCard task={currentTask} />

						{/* Voting Cards */}
						{!showResults && currentTask && (
							<div className="space-y-4">
								<h3 className="font-semibold text-lg">Select your estimate:</h3>
								<VotingCards
									selectedValue={selectedValue}
									onSelect={handleVote}
									disabled={allVoted}
								/>
							</div>
						)}

						{/* Results */}
						{showResults && votes && votes.length > 0 && (
							<div className="space-y-4">
								<VoteResults
									votes={votes
										.filter((vote) => vote.user) // Filter out votes without user data
										.map((vote) => ({
											userId: vote.userId,
											userName: vote.user.name,
											userEmail: vote.user.email, // email is required in User model, so it should always be present
											storyPoints: vote.storyPoints as PlanningPokerStoryPoint
										}))}
								/>

								{/* Final Story Points Input (Admin only) */}
								{/* biome-ignore lint/a11y/useValidAriaRole: <explanation> */}
								<Protect role="org:admin">
									{isCreator && (
										<div className="space-y-4 rounded-lg border bg-card p-4">
											<Label htmlFor="finalStoryPoints">
												Final Story Points
											</Label>
											<Input
												id="finalStoryPoints"
												type="number"
												min="1"
												placeholder="1, 2, 3, 5, 8, 13, 21"
												value={finalStoryPoints ?? ''}
												onChange={(e) => {
													const value = e.target.value;
													setFinalStoryPoints(
														value ? Number.parseInt(value, 10) : null
													);
												}}
											/>
											<p className="text-muted-foreground text-xs">
												Must follow Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21
											</p>
											<Button
												onClick={() => {
													if (isLastTask) {
														handleFinalizeLastTaskClick();
													} else {
														handleFinalizeTask();
													}
												}}
												disabled={isFinalizing}
												className="w-full"
											>
												{isFinalizing ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Finalizing...
													</>
												) : isLastTask ? (
													'Finalize Last Task & End Session'
												) : (
													'Finalize & Move to Next Task'
												)}
											</Button>
										</div>
									)}
								</Protect>
							</div>
						)}
					</div>
				</div>

				{/* Sidebar */}
				<div className="w-80 border-l bg-muted/30 p-4">
					{userId && <MemberList members={members} currentUserId={userId} />}
				</div>
			</div>

			{/* Dialogs */}
			<EndSessionDialog
				onConfirm={handleEndSessionConfirm}
				isEnding={isEnding}
			/>
			<FinalizeLastTaskDialog
				onConfirm={handleFinalizeLastTaskConfirm}
				isFinalizing={isFinalizing}
				isEnding={isEnding}
			/>
		</div>
	);
}
