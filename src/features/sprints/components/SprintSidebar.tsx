'use client';

import { SprintStatusEnum } from '@prisma/client';
import dayjs from 'dayjs';
import {
	AlertTriangle,
	BarChart3,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Circle,
	ClipboardList,
	Clock,
	Kanban,
	Layers,
	Lightbulb,
	Milestone as MilestoneIcon,
	Pencil,
	Play,
	Plus,
	Trash2
} from 'lucide-react';
import { useState } from 'react';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Dialog } from '~/common/components/ui/dialog';
import { Progress } from '~/common/components/ui/progress';
import { useDialog } from '~/common/hooks/useDialog';
import EpicDialog from '~/features/epics/components/EpicDialog';
import { useEpicMutations } from '~/features/epics/hooks/useEpicMutations';
import type { EpicsApiOutput } from '~/features/epics/types/Epic.type';
import { cn } from '~/lib/utils';
import { useSprintMutations } from '../hooks/useSprintMutations';
import type { SprintsApiOutput } from '../types/Sprint.type';
import SprintDialog from './SprintDialog';

type SprintWithStats = SprintsApiOutput[number];

interface SprintSidebarProps {
	projectId: string;
	sprints: SprintsApiOutput;
	canManageSprints: boolean;
	epics: EpicsApiOutput;
	selectedSprintId: string | null;
	currentView: string | null;
	onSelectBoard: () => void;
	onSelectReports: () => void;
	onSelectSprint: (id: string) => void;
	onSelectBacklog: () => void;
	onSelectRoadmap: () => void;
	onSelectVersions: () => void;
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

const EpicEntry = ({
	epic,
	onEdit,
	onDelete
}: {
	epic: EpicsApiOutput[number];
	onEdit: () => void;
	onDelete: () => void;
}) => {
	const progress = epic.progress ?? 0;
	const status = epic.status ?? 'PLANNED';

	return (
		<div className="group rounded-lg border border-transparent px-3 py-2 hover:border-border hover:bg-muted/50">
			<div className="flex items-start gap-2">
				<Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-epic" />
				<div className="min-w-0 flex-1">
					<div className="flex items-center justify-between gap-2">
						<span className="truncate font-medium text-sm">{epic.title}</span>
						<Badge
							variant={status === 'COMPLETED' ? 'success' : 'secondary'}
							className="shrink-0 px-1.5 py-0 text-[10px]"
						>
							{status === 'IN_PROGRESS'
								? 'In progress'
								: status === 'PLANNED'
									? 'Planned'
									: 'Completed'}
						</Badge>
					</div>
					{epic.startDate && epic.endDate && (
						<div className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
							<Clock className="h-3 w-3" />
							{dayjs(epic.startDate).format('MMM D')} –{' '}
							{dayjs(epic.endDate).format('MMM D')}
						</div>
					)}
					<div className="mt-2 flex items-center gap-2">
						<Progress
							value={progress}
							className="h-1 flex-1 bg-epic-muted [&>div]:bg-epic"
						/>
						<span className="text-[10px] text-muted-foreground">
							{progress}%
						</span>
					</div>
				</div>
			</div>
			<div className="mt-1 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={onEdit}
					aria-label={`Edit ${epic.title}`}
				>
					<Pencil className="h-3.5 w-3.5" />
				</Button>
				<ConfirmationDialog
					title="Delete Epic"
					description={`Delete "${epic.title}"? Its tasks will lose their epic assignment.`}
					onConfirm={onDelete}
				>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 text-destructive hover:text-destructive"
						aria-label={`Delete ${epic.title}`}
					>
						<Trash2 className="h-3.5 w-3.5" />
					</Button>
				</ConfirmationDialog>
			</div>
		</div>
	);
};

const SprintEntry = ({
	sprint,
	isSelected,
	onSelect,
	onStart,
	onComplete,
	onEdit,
	onDelete,
	isStarting,
	isCompleting,
	isDeleting,
	canManage
}: {
	sprint: SprintWithStats;
	isSelected: boolean;
	onSelect: () => void;
	onStart: () => void;
	onComplete: () => void;
	onEdit: () => void;
	onDelete: () => void;
	isStarting: boolean;
	isCompleting: boolean;
	isDeleting: boolean;
	canManage: boolean;
}) => {
	const progress =
		sprint.committedPoints !== null && sprint.committedPoints > 0
			? Math.round((sprint.completedPoints / sprint.committedPoints) * 100)
			: sprint.taskCount > 0
				? Math.round((sprint.doneCount / sprint.taskCount) * 100)
				: 0;
	const hasDateRange = sprint.startDate && sprint.endDate;
	const isOverdue = sprint.isOverdue;

	return (
		<div
			className={cn(
				'group w-full rounded-lg border px-3 py-2.5 text-left transition-all',
				isSelected
					? 'border-info-border bg-info-muted'
					: 'border-transparent hover:border-border hover:bg-muted/50',
				sprint.status === SprintStatusEnum.ACTIVE &&
					(isOverdue
						? 'border-warning-border/60 bg-warning-muted/20'
						: 'border-success-border/50 bg-success-muted/20')
			)}
		>
			<button type="button" onClick={onSelect} className="w-full text-left">
				<div className="flex items-start justify-between gap-2">
					<div className="flex min-w-0 items-center gap-2">
						<StatusIcon status={sprint.status} />
						<span className="truncate font-medium text-sm">{sprint.title}</span>
					</div>
					{(sprint.totalPoints > 0 || sprint.committedPoints !== null) && (
						<Badge
							variant="secondary"
							className="shrink-0 px-1.5 py-0 text-xs tabular-nums"
						>
							{sprint.committedPoints !== null
								? `${sprint.completedPoints}/${sprint.committedPoints} pts`
								: `${sprint.totalPoints} pts`}
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
				{isOverdue && (
					<div className="mt-1 flex items-center gap-1 text-warning-muted-foreground text-xs">
						<AlertTriangle className="h-3 w-3" />
						Overdue
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
			</button>

			{sprint.status === SprintStatusEnum.PLANNING && canManage && (
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

			{sprint.status === SprintStatusEnum.ACTIVE && canManage && (
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
			{canManage && (
				<div className="mt-1 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
					{sprint.status !== SprintStatusEnum.COMPLETED && (
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={onEdit}
							aria-label={`Edit ${sprint.title}`}
						>
							<Pencil className="h-3.5 w-3.5" />
						</Button>
					)}
					{sprint.status === SprintStatusEnum.PLANNING && (
						<ConfirmationDialog
							title="Delete Sprint"
							description={`Delete "${sprint.title}"? Its tasks will lose their sprint assignment.`}
							onConfirm={onDelete}
						>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 text-destructive hover:text-destructive"
								disabled={isDeleting}
								aria-label={`Delete ${sprint.title}`}
							>
								<Trash2 className="h-3.5 w-3.5" />
							</Button>
						</ConfirmationDialog>
					)}
				</div>
			)}
		</div>
	);
};

export default function SprintSidebar({
	projectId,
	sprints,
	canManageSprints,
	epics,
	selectedSprintId,
	currentView,
	onSelectBoard,
	onSelectReports,
	onSelectSprint,
	onSelectBacklog,
	onSelectRoadmap,
	onSelectVersions
}: SprintSidebarProps) {
	const [collapsed, setCollapsed] = useState(false);
	const [selectedSprintForEdit, setSelectedSprintForEdit] =
		useState<SprintWithStats | null>(null);
	const { openDialog, closeDialog, isDialogOpen } = useDialog('sprint');
	const { openDialog: openEpicDialog } = useDialog('epic');
	const { startSprint, completeSprint, deleteSprint } = useSprintMutations({
		projectId
	});
	const { deleteEpic } = useEpicMutations({ projectId });
	const [selectedEpicForEdit, setSelectedEpicForEdit] = useState<
		EpicsApiOutput[number] | null
	>(null);

	const grouped = statusOrder.reduce<
		Record<SprintStatusEnum, SprintWithStats[]>
	>(
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
				<button
					type="button"
					onClick={onSelectBoard}
					className={cn(
						'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all',
						currentView !== 'backlog' &&
							currentView !== 'sprint' &&
							currentView !== 'roadmap' &&
							currentView !== 'reports' &&
							currentView !== 'versions' &&
							currentView !== 'list'
							? 'bg-info-muted font-medium text-info-muted-foreground'
							: 'hover:bg-muted/50'
					)}
				>
					<Kanban className="h-4 w-4 shrink-0" />
					<span>Board</span>
				</button>

				<button
					type="button"
					onClick={onSelectReports}
					className={cn(
						'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all',
						currentView === 'reports'
							? 'bg-info-muted font-medium text-info-muted-foreground'
							: 'hover:bg-muted/50'
					)}
				>
					<BarChart3 className="h-4 w-4 shrink-0" />
					<span>Reports</span>
				</button>

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

				<button
					type="button"
					onClick={onSelectRoadmap}
					className={cn(
						'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all',
						currentView === 'roadmap'
							? 'bg-info-muted font-medium text-info-muted-foreground'
							: 'hover:bg-muted/50'
					)}
				>
					<MilestoneIcon className="h-4 w-4 shrink-0" />
					<span>Roadmap</span>
				</button>

				<button
					type="button"
					onClick={onSelectVersions}
					className={cn(
						'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all',
						currentView === 'versions'
							? 'bg-info-muted font-medium text-info-muted-foreground'
							: 'hover:bg-muted/50'
					)}
				>
					<Layers className="h-4 w-4 shrink-0" />
					<span>Versions</span>
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
										onEdit={() => {
											setSelectedSprintForEdit(sprint);
											openDialog('sprint');
										}}
										onDelete={() => deleteSprint.mutate({ id: sprint.id })}
										isStarting={startSprint.isPending}
										isCompleting={completeSprint.isPending}
										isDeleting={deleteSprint.isPending}
										canManage={canManageSprints}
									/>
								))}
							</div>
						</div>
					);
				})}

				<div className="pt-3">
					<div className="mb-1 flex items-center justify-between px-3">
						<p className="flex items-center gap-1 font-medium text-muted-foreground text-xs uppercase tracking-wider">
							<Lightbulb className="h-3 w-3 text-epic" />
							Epics
						</p>
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							aria-label="New epic"
							onClick={() => {
								setSelectedEpicForEdit(null);
								openEpicDialog('epic');
							}}
						>
							<Plus className="h-3.5 w-3.5" />
						</Button>
					</div>
					<div className="space-y-0.5">
						{epics.map((epic) => (
							<EpicEntry
								key={epic.id}
								epic={epic}
								onEdit={() => {
									setSelectedEpicForEdit(epic);
									openEpicDialog('epic');
								}}
								onDelete={() => deleteEpic.mutate({ id: epic.id })}
							/>
						))}
						{epics.length === 0 && (
							<p className="px-3 py-2 text-muted-foreground text-xs">
								No epics yet
							</p>
						)}
					</div>
				</div>
			</div>

			{canManageSprints && (
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
			)}

			<Dialog open={isDialogOpen} onOpenChange={closeDialog}>
				<SprintDialog
					projectId={projectId}
					sprint={selectedSprintForEdit}
					onCancel={closeDialog}
				/>
			</Dialog>
			<EpicDialog projectId={projectId} epic={selectedEpicForEdit} />
		</div>
	);
}
