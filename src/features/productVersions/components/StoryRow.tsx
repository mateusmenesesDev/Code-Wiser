'use client';

import type { TaskStatusEnum } from '@prisma/client';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/common/components/ui/button';
import { cn } from '~/lib/utils';

type Story = {
	id: string;
	title: string;
	status: TaskStatusEnum | null;
	publicNumber: number | null;
};

type VersionOption = {
	id: string;
	name: string;
};

interface StoryRowProps {
	story: Story;
	versions: VersionOption[];
	readOnly: boolean;
	onAssign: (versionId: string | null) => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	canMove?: boolean;
}

export default function StoryRow({
	story,
	versions,
	readOnly,
	onAssign,
	onMoveUp,
	onMoveDown,
	canMove = true
}: StoryRowProps) {
	const [assignment, setAssignment] = useState('');

	return (
		<div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-muted/30">
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							'h-2 w-2 shrink-0 rounded-full',
							story.status === 'DONE' ? 'bg-success' : 'bg-muted-foreground/40'
						)}
						aria-hidden="true"
					/>
					<div className="truncate font-medium text-sm">{story.title}</div>
				</div>
				<div className="mt-1 text-muted-foreground text-xs">
					{story.publicNumber ? `#${story.publicNumber} · ` : ''}
					{story.status
						? story.status.replaceAll('_', ' ').toLowerCase()
						: 'Backlog'}
				</div>
			</div>
			{onMoveUp && onMoveDown && (
				<div className="flex gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						disabled={readOnly}
						onClick={onMoveUp}
						aria-label={`Move ${story.title} up`}
					>
						<ArrowUp className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						disabled={readOnly}
						onClick={onMoveDown}
						aria-label={`Move ${story.title} down`}
					>
						<ArrowDown className="h-3.5 w-3.5" />
					</Button>
				</div>
			)}
			{canMove && (
				<select
					value={assignment}
					disabled={readOnly}
					onChange={(event) => {
						const value = event.target.value;
						setAssignment('');
						onAssign(value === '__unassigned' ? null : value || null);
					}}
					aria-label={`Move ${story.title} to another version`}
					className="h-8 max-w-full rounded-md border bg-background px-2 text-xs"
				>
					<option value="">Move to...</option>
					<option value="__unassigned">No version</option>
					{versions.map((version) => (
						<option key={version.id} value={version.id}>
							{version.name}
						</option>
					))}
				</select>
			)}
		</div>
	);
}
