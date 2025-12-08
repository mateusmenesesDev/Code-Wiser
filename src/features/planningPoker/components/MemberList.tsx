'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '~/lib/utils';

interface Member {
	id: string;
	name: string | null;
	email: string;
	hasVoted?: boolean;
}

interface MemberListProps {
	members: Member[];
	currentUserId: string;
}

export function MemberList({ members, currentUserId }: MemberListProps) {
	return (
		<div className="space-y-2">
			<h3 className="mb-4 font-semibold text-sm">Participants</h3>
			{members.map((member) => {
				const isCurrentUser = member.id === currentUserId;
				return (
					<div
						key={member.id}
						className={cn(
							'flex items-center gap-2 rounded-lg border p-3',
							isCurrentUser && 'border-primary bg-primary/5'
						)}
					>
						{member.hasVoted ? (
							<CheckCircle2 className="h-5 w-5 text-green-500" />
						) : (
							<Circle className="h-5 w-5 text-muted-foreground" />
						)}
						<div className="flex-1">
							<div className="font-medium text-sm">
								{member.name || member.email}
								{isCurrentUser && (
									<span className="ml-2 text-primary text-xs">(You)</span>
								)}
							</div>
							{member.email !== member.name && (
								<div className="text-muted-foreground text-xs">
									{member.email}
								</div>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
