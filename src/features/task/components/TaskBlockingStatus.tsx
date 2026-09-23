'use client';

import { AlertTriangle, Link2 } from 'lucide-react';
import { Badge } from '~/common/components/ui/badge';
import { cn } from '~/lib/utils';

type TaskBlockingStatusProps = {
	blocked?: boolean | null;
	blockedReason?: string | null;
	blockedByTask?: { id: string; title: string } | null;
	blockingTaskCount?: number;
	compact?: boolean;
};

export function TaskBlockingStatus({
	blocked,
	blockedReason,
	blockedByTask,
	blockingTaskCount = 0,
	compact = false
}: TaskBlockingStatusProps) {
	const isBlocked = Boolean(blocked || blockedByTask);
	if (!isBlocked && blockingTaskCount === 0) return null;

	return (
		<div
			className={cn('flex flex-wrap items-center gap-1.5', compact && 'gap-1')}
		>
			{isBlocked && (
				<Badge variant="warning" className="gap-1">
					<AlertTriangle className="h-3 w-3" aria-hidden="true" />
					Blocked
				</Badge>
			)}
			{blockedByTask && (
				<span
					className="max-w-full truncate text-warning-muted-foreground text-xs"
					title={`Waiting for: ${blockedByTask.title}`}
				>
					Waiting for: {blockedByTask.title}
				</span>
			)}
			{blockingTaskCount > 0 && (
				<Badge variant="secondary" className="gap-1">
					<Link2 className="h-3 w-3" aria-hidden="true" />
					Blocks {blockingTaskCount}
				</Badge>
			)}
			{blockedReason && (
				<p
					className={cn(
						'w-full truncate text-muted-foreground text-xs',
						compact && 'max-w-[18rem]'
					)}
					title={blockedReason}
				>
					{blockedReason}
				</p>
			)}
		</div>
	);
}
