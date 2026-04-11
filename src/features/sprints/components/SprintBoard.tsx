'use client';

import { SprintStatusEnum, type TaskStatusEnum } from '@prisma/client';
import dayjs from 'dayjs';
import { CheckCircle2, Clock, LayoutGrid, List, Play, Zap } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Input } from '~/common/components/ui/input';
import {
	KanbanBoard,
	KanbanCards,
	KanbanHeader,
	type KanbanItemProps,
	KanbanProvider
} from '~/common/components/ui/kanban';
import KanbanCardContent from '~/features/kanban/components/KanbanCardContent';
import { columns } from '~/features/kanban/constants';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';
import type { SprintsApiOutput } from '../types/Sprint.type';
import SprintListView from './SprintListView';

type SprintData = SprintsApiOutput[number];

interface SprintBoardProps {
	sprint: SprintData;
	projectId: string;
}

const statusBadgeVariant: Record<SprintStatusEnum, string> = {
	PLANNING: 'secondary',
	ACTIVE: 'success',
	COMPLETED: 'outline'
};

const statusLabel: Record<SprintStatusEnum, string> = {
	PLANNING: 'Planning',
	ACTIVE: 'Active',
	COMPLETED: 'Completed'
};

const QuickAddRow = ({
	columnId,
	sprintId,
	projectId,
	onAdded
}: {
	columnId: string;
	sprintId: string;
	projectId: string;
	onAdded: () => void;
}) => {
	const [value, setValue] = useState('');
	const [isOpen, setIsOpen] = useState(false);

	const createTask = api.task.create.useMutation({
		onSuccess: () => {
			setValue('');
			setIsOpen(false);
			onAdded();
		}
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!value.trim()) return;
		createTask.mutate({
			title: value.trim(),
			projectId,
			sprintId,
			status: columnId as TaskStatusEnum,
			isTemplate: false
		});
	};

	if (!isOpen) {
		return (
			<button
				type="button"
				className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted/50 hover:text-foreground"
				onClick={() => setIsOpen(true)}
			>
				<span className="text-lg leading-none">+</span>
				<span>Add task</span>
			</button>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="mt-2 flex gap-1">
			<Input
				autoFocus
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder="Task title..."
				className="h-8 text-sm"
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						setIsOpen(false);
						setValue('');
					}
				}}
			/>
			<Button
				type="submit"
				size="sm"
				className="h-8 shrink-0"
				disabled={createTask.isPending || !value.trim()}
			>
				Add
			</Button>
		</form>
	);
};

export default function SprintBoard({ sprint, projectId }: SprintBoardProps) {
	const [boardView, setBoardView] = useState<'kanban' | 'list'>('kanban');
	const utils = api.useUtils();

	const { data: tasks = [] } = api.kanban.getKanbanData.useQuery({
		projectId,
		filters: { sprintId: sprint.id }
	});

	const updateTaskOrders = api.task.updateTaskOrders.useMutation({
		onSettled: () => {
			utils.kanban.getKanbanData.invalidate({ projectId });
		}
	});

	const handleDataChange = (data: KanbanItemProps[]) => {
		const updates = data.map((task, index) => ({
			id: task.id,
			order: index,
			status: task.status as TaskStatusEnum
		}));
		updateTaskOrders.mutate({ updates });
	};

	const handleTaskAdded = () => {
		utils.kanban.getKanbanData.invalidate({
			projectId,
			filters: { sprintId: sprint.id }
		});
		utils.sprint.getAllByProjectId.invalidate({ projectId });
	};

	const totalPoints = tasks.reduce(
		(sum, t) => sum + ((t as { storyPoints?: number | null }).storyPoints ?? 0),
		0
	);

	const hasDateRange = sprint.startDate && sprint.endDate;

	return (
		<div className="flex h-full flex-col">
			{/* Sprint header */}
			<div className="flex shrink-0 items-center justify-between border-b bg-card px-4 py-3">
				<div className="flex items-center gap-3">
					<div>
						<div className="flex items-center gap-2">
							<h2 className="font-semibold text-lg">{sprint.title}</h2>
							<Badge
								variant={
									statusBadgeVariant[sprint.status] as
										| 'secondary'
										| 'success'
										| 'outline'
								}
								className="text-xs"
							>
								{sprint.status === SprintStatusEnum.ACTIVE && (
									<Play className="mr-1 h-3 w-3 fill-current" />
								)}
								{sprint.status === SprintStatusEnum.COMPLETED && (
									<CheckCircle2 className="mr-1 h-3 w-3" />
								)}
								{statusLabel[sprint.status]}
							</Badge>
						</div>
						{hasDateRange && (
							<p className="flex items-center gap-1 text-muted-foreground text-xs">
								<Clock className="h-3 w-3" />
								{dayjs(sprint.startDate).format('MMM D, YYYY')} –{' '}
								{dayjs(sprint.endDate).format('MMM D, YYYY')}
							</p>
						)}
					</div>
				</div>
				<div className="flex items-center gap-3">
					{totalPoints > 0 && (
						<div className="flex items-center gap-1 text-muted-foreground text-sm">
							<Zap className="h-4 w-4 text-amber-500" />
							<span className="font-medium text-foreground">{totalPoints}</span>
							<span>story pts</span>
						</div>
					)}
					<div className="flex items-center rounded-lg border bg-muted p-0.5">
						<Button
							variant="ghost"
							size="sm"
							className={cn(
								'h-7 gap-1.5 px-2',
								boardView === 'kanban' && 'bg-background shadow-sm'
							)}
							onClick={() => setBoardView('kanban')}
						>
							<LayoutGrid className="h-3.5 w-3.5" />
							<span className="text-xs">Board</span>
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className={cn(
								'h-7 gap-1.5 px-2',
								boardView === 'list' && 'bg-background shadow-sm'
							)}
							onClick={() => setBoardView('list')}
						>
							<List className="h-3.5 w-3.5" />
							<span className="text-xs">List</span>
						</Button>
					</div>
				</div>
			</div>

			{/* Board content */}
			<div className="flex-1 overflow-hidden">
				{boardView === 'kanban' ? (
					<KanbanProvider
						columns={columns}
						data={tasks}
						onDataChange={handleDataChange}
					>
						{(column) => {
							const columnTasks = tasks.filter((t) => t.status === column.id);
							return (
								<KanbanBoard
									id={column.id}
									key={column.id}
									className="bg-card/30"
								>
									<KanbanHeader>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<div
													className="h-2 w-2 rounded-full shadow-sm"
													style={{ backgroundColor: column.color }}
												/>
												<span className="font-semibold text-sm">
													{column.name}
												</span>
											</div>
											<span
												className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 font-medium text-xs"
												style={{
													backgroundColor: column.color,
													color: 'white'
												}}
											>
												{columnTasks.length}
											</span>
										</div>
										<QuickAddRow
											columnId={column.id}
											sprintId={sprint.id}
											projectId={projectId}
											onAdded={handleTaskAdded}
										/>
									</KanbanHeader>
									<KanbanCards id={column.id}>
										{(task) => <SprintKanbanCard task={task} />}
									</KanbanCards>
								</KanbanBoard>
							);
						}}
					</KanbanProvider>
				) : (
					<SprintListView
						tasks={tasks}
						sprintId={sprint.id}
						projectId={projectId}
						onTaskUpdated={handleTaskAdded}
					/>
				)}
			</div>
		</div>
	);
}

const SprintKanbanCard = ({ task }: { task: KanbanItemProps }) => {
	const storyPoints = (task as { storyPoints?: number | null }).storyPoints;

	return (
		<div className="relative">
			<KanbanCardContent task={task} />
			{storyPoints != null && storyPoints > 0 && (
				<div className="absolute right-2 bottom-2">
					<Badge
						variant="secondary"
						className="px-1.5 py-0 font-mono text-xs tabular-nums"
					>
						{storyPoints}
					</Badge>
				</div>
			)}
		</div>
	);
};
