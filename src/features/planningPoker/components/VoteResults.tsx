'use client';

import { Avatar, AvatarFallback } from '~/common/components/ui/avatar';
import type { PlanningPokerStoryPoint } from '~/features/planningPoker/types/planningPoker.types';

interface Vote {
	userId: string;
	userName: string | null;
	userEmail: string;
	storyPoints: PlanningPokerStoryPoint;
}

interface VoteResultsProps {
	votes: Vote[];
}

export function VoteResults({ votes }: VoteResultsProps) {
	const getInitials = (name: string | null, email: string) => {
		if (name) {
			return name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.substring(0, 2);
		}
		if (email && email.length > 0) {
			return email[0]?.toUpperCase() ?? '?';
		}
		return '?';
	};

	return (
		<div className="space-y-4">
			<h3 className="font-semibold text-lg">Voting Results</h3>
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				{votes.map((vote) => (
					<div
						key={vote.userId}
						className="flex items-center gap-3 rounded-lg border p-3"
					>
						<Avatar>
							<AvatarFallback>
								{getInitials(vote.userName, vote.userEmail)}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1">
							<div className="font-medium text-sm">
								{vote.userName || vote.userEmail || 'Unknown User'}
							</div>
							{vote.userEmail && vote.userEmail !== vote.userName && (
								<div className="text-muted-foreground text-xs">
									{vote.userEmail}
								</div>
							)}
						</div>
						<div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-primary bg-primary/10 font-bold text-lg">
							{vote.storyPoints ?? '?'}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
