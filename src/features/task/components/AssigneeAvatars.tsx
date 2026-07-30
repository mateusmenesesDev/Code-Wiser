'use client';

import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from '~/common/components/ui/avatar';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';

type Assignee = {
	id: string;
	name: string | null;
};

function AssigneeAvatar({
	assignee,
	className
}: {
	assignee: Assignee;
	className?: string;
}) {
	const { data: imageUrl } = api.task.getAssigneeImage.useQuery(
		{ assigneeId: assignee.id },
		{ enabled: !!assignee.id }
	);

	const initial = assignee.name?.charAt(0).toUpperCase() ?? '?';

	return (
		<Avatar
			className={cn('h-5 w-5 ring-2 ring-background', className)}
			title={assignee.name ?? undefined}
		>
			{imageUrl ? (
				<AvatarImage src={imageUrl} alt={assignee.name ?? 'Assignee'} />
			) : null}
			<AvatarFallback className="bg-primary/10 font-medium text-[10px] text-primary">
				{initial}
			</AvatarFallback>
		</Avatar>
	);
}

interface AssigneeAvatarsProps {
	assignees?: Assignee[] | null;
	maxVisible?: number;
}

export function AssigneeAvatars({
	assignees,
	maxVisible = 3
}: AssigneeAvatarsProps) {
	const list = assignees ?? [];
	if (list.length === 0) return null;

	const visible = list.slice(0, maxVisible);
	const remaining = list.length - visible.length;

	return (
		<div className="flex items-center -space-x-1.5">
			{visible.map((assignee) => (
				<AssigneeAvatar key={assignee.id} assignee={assignee} />
			))}
			{remaining > 0 && (
				<div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted font-medium text-[10px] text-muted-foreground ring-2 ring-background">
					+{remaining}
				</div>
			)}
		</div>
	);
}
