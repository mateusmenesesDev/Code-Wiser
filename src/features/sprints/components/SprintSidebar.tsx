'use client';

import { SprintStatusEnum } from '@prisma/client';
import dayjs from 'dayjs';
import {
	ChevronLeft,
	ChevronRight,
	Circle,
	ClipboardList,
	Clock,
	Plus,
	Play,
	CheckCircle2
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Dialog } from '~/common/components/ui/dialog';
import { Progress } from '~/common/components/ui/progress';
import { useDialog } from '~/common/hooks/useDialog';
import { cn } from '~/lib/utils';
import { useSprintMutations } from '../hooks/useSprintMutations';
import type { SprintsApiOutput } from '../types/Sprint.type';
import SprintDialog from './SprintDialog';

type SprintWithStats = SprintsApiOutput[number];

interface SprintSidebarProps {
	projectId: string;
	sprints: SprintsApiOutput;
	selectedSprintId: string | null;
	currentView: string | null;
	onSelectSprint: (id: string) => void;
	onSelectBacklog: () => void;
}

const statusOrder: SprintStatusEnum[] = [
	SprintStatusEnum.ACTIVE,
	SprintStatusEnum.PLANNING,
	SprintStatusEnum.COMPLETED
];

const statusLabel: Record<SprintStatusEnum, string> = {
	ACTIVE: 'Active',
	PLANNING: 'Planning',
	COMPLETED: 'Completed'
};

const StatusIcon = ({ status }: { status: SprintStatusEnum }) => {
	if (status === SprintStatusEnum.ACTIVE)
		return <Play className="h-3 w-3 fill-success text-success" />;
	if (status === SprintStatusEnum.COMPLETED)
		return <CheckCircle2 className="h-3 w-3 text-muted-foreground" />;
	return <Circle className="h-3 w-3 text-info" />;
};

const SprintEntry = ({
	sprint,
	isSelected,
	onSelect,
	onStart,
	onComplete,
	isStarting,
	isCompleting
}: {
	sprint: SprintWithStats;
	isSelected: boolean;
	onSelect: () => void;
	onStart: () => void;
	onComplete: () => void;
	isStarting: boolean;
	isCompleting: boolean;
}) => {
	const progress =
		sprint.taskCount > 0
			? Math.round((sprint.doneCount / sprint.taskCount) * 100)
			: 0;
	const hasDateRange = sprint.startDate && sprint.endDate;

	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				'group w-full rounded-lg border px-3 py-2.5 text-left transition-all',
				isSelected
					? 'border-info-border bg-info-muted'
					: 'border-transparent hover:border-border hover:bg-muted/50',
				sprint.status === SprintStatusEnum.ACTIVE &&
					'border-success-border/50 bg-success-muted/20'
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex min-w-0 items-center gap-2">
					<StatusIcon status={sprint.status} />
					<span className="truncate font-medium text-sm">{sprint.title}</span>
				</div>
				{sprint.totalPoints > 0 && (
					<Badge
						variant="secondary"
						className="shrink-0 px-1.5 py-0 text-xs tabular-nums"
					>
						{sprint.totalPoints} pts
					</Badge>
				)}
			</div>

			{hasDateRange && (
				<div className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
					<Clock className="h-3 w-3" />
					<span>
						{dayjs(sprint.startDate).format('MMM D')} –{' '}
						{dayjs(sprint.endDate).format('MMM D')}
					</span>
				</div>
			)}

			{sprint.taskCount > 0 && (
				<div className="mt-2 space-y-1">
					<Progress
						value={progress}
						className={cn(
							'h-1',
							sprint.status === SprintStatusEnum.ACTIVE
								? 'bg-success-muted [&>div]:bg-success'
								: 'bg-info-muted [&>div]:bg-info'
						)}
					/>
					<span className="text-muted-foreground text-xs">
						{sprint.doneCount}/{sprint.taskCount} done
					</span>
				</div>
			)}

			{sprint.status === SprintStatusEnum.PLANNING && (
				<div className="mt-2 hidden group-hover:block">
					<Button
						variant="outline"
						size="sm"
						className="h-6 w-full border-success-border text-success-muted-foreground text-xs hover:bg-success-muted"
						disabled={isStarting}
						onClick={(e) => {
							e.stopPropagation();
							onStart();
						}}
					>
						{isStarting ? 'Starting...' : 'Start Sprint'}
					</Button>
				</div>
			)}

			{sprint.status === SprintStatusEnum.ACTIVE && (
				<div className="mt-2 hidden group-hover:block">
					<Button
						variant="outline"
						size="sm"
						className="h-6 w-full border-warning-border text-warning-muted-foreground text-xs hover:bg-warning-muted"
						disabled={isCompleting}
						onClick={(e) => {
							e.stopPropagation();
							onComplete();
						}}
					>
						{isCompleting ? 'Completing...' : 'Complete Sprint'}
					</Button>
				</div>
			)}
		</button>
	);
};

export default function SprintSidebar({
	projectId,
	sprints,
	selectedSprintId,
	currentView,
	onSelectSprint,
	onSelectBacklog
}: SprintSidebarProps) {
	const [collapsed, setCollapsed] = useState(false);
	const [selectedSprintForEdit, setSelectedSprintForEdit] =
		useState<SprintWithStats | null>(null);
	const { openDialog, closeDialog, isDialogOpen } = useDialog('sprint');
	const { startSprint, completeSprint } = useSprintMutations({ projectId });

	const grouped = statusOrder.reduce<Record<SprintStatusEnum, SprintWithStats[]>>(
		(acc, status) => {
			acc[status] = sprints.filter((s) => s.status === status);
			return acc;
		},
		{ ACTIVE: [], PLANNING: [], COMPLETED: [] }
	);

	if (collapsed) {
		return (
			<div className="flex w-10 flex-col items-center border-r bg-card pt-4">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={() => setCollapsed(false)}
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		);
	}

	return (
		<div className="flex w-56 shrink-0 flex-col border-r bg-card">
			<div className="flex items-center justify-between border-b px-3 py-2">
				<span className="font-semibold text-sm">Sprints</span>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={() => setCollapsed(true)}
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
			</div>

			<div className="flex-1 space-y-1 overflow-y-auto p-2">
				{/* Backlog entry */}
				<button
					type="button"
					onClick={onSelectBacklog}
					className={cn(
						'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all',
						currentView === 'backlog'
							? 'bg-info-muted font-medium text-info-muted-foreground'
							: 'hover:bg-muted/50'
					)}
				>
					<ClipboardList className="h-4 w-4 shrink-0" />
					<span>Backlog</span>
				</button>

				{statusOrder.map((status) => {
					const group = grouped[status];
					if (group.length === 0) return null;
					return (
						<div key={status} className="pt-2">
							<p className="mb-1 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
								{statusLabel[status]}
							</p>
							<div className="space-y-0.5">
								{group.map((sprint) => (
									<SprintEntry
										key={sprint.id}
										sprint={sprint}
										isSelected={selectedSprintId === sprint.id}
										onSelect={() => onSelectSprint(sprint.id)}
										onStart={() => startSprint.mutate({ id: sprint.id })}
										onComplete={() => completeSprint.mutate({ id: sprint.id })}
										isStarting={startSprint.isPending}
										isCompleting={completeSprint.isPending}
									/>
								))}
							</div>
						</div>
					);
				})}
			</div>

			<div className="border-t p-2">
				<Button
					variant="ghost"
					size="sm"
					className="w-full justify-start gap-2 text-muted-foreground"
					onClick={() => {
						setSelectedSprintForEdit(null);
						openDialog('sprint');
					}}
				>
					<Plus className="h-4 w-4" />
					New Sprint
				</Button>
			</div>

			<Dialog open={isDialogOpen} onOpenChange={closeDialog}>
				<SprintDialog
					projectId={projectId}
					sprint={selectedSprintForEdit}
					onCancel={closeDialog}
				/>
			</Dialog>
		</div>
	);
}
