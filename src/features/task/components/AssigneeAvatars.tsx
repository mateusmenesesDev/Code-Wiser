'use client';

import Image from 'next/image';
import { api } from '~/trpc/react';

type Assignee = {
	id: string;
	name: string | null;
};

function AssigneeAvatar({ assignee }: { assignee: Assignee }) {
	const { data: imageUrl } = api.task.getAssigneeImage.useQuery(
		{ assigneeId: assignee.id },
		{ enabled: !!assignee.id }
	);

	if (imageUrl) {
		return (
			<Image
				src={imageUrl}
				alt={assignee.name ?? 'Assignee'}
				className="rounded-full ring-2 ring-background"
				width={20}
				height={20}
				title={assignee.name ?? undefined}
			/>
		);
	}

	return (
		<div
			className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 font-medium text-[10px] text-primary ring-2 ring-background"
			title={assignee.name ?? undefined}
		>
			{assignee.name?.charAt(0).toUpperCase()}
		</div>
	);
}

interface AssigneeAvatarsProps {
	assignees: Assignee[];
	maxVisible?: number;
}

export function AssigneeAvatars({
	assignees,
	maxVisible = 3
}: AssigneeAvatarsProps) {
	if (assignees.length === 0) return null;

	const visible = assignees.slice(0, maxVisible);
	const remaining = assignees.length - visible.length;

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
