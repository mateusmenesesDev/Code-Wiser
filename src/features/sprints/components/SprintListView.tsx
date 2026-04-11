'use client';

import type { TaskStatusEnum } from '@prisma/client';
import { useQueryState } from 'nuqs';
import { Badge } from '~/common/components/ui/badge';
import { getBadgeTaskPriorityColor } from '~/common/utils/colorUtils';
import { columns } from '~/features/kanban/constants';
import type { RouterOutputs } from '~/trpc/react';

type KanbanTask = RouterOutputs['kanban']['getKanbanData'][number];

interface SprintListViewProps {
	tasks: KanbanTask[];
	sprintId: string;
	projectId: string;
	onTaskUpdated: () => void;
}

const statusDisplayName: Partial<Record<TaskStatusEnum, string>> = {
	BACKLOG: 'Backlog',
	READY_TO_DEVELOP: 'Ready to Develop',
	IN_PROGRESS: 'In Progress',
	CODE_REVIEW: 'Code Review',
	TESTING: 'Testing',
	DONE: 'Done'
};

const TaskRow = ({ task }: { task: KanbanTask }) => {
	const [, setTaskId] = useQueryState('taskId');
	const storyPoints = (task as { storyPoints?: number | null }).storyPoints;

	return (
		<button
			type="button"
			onClick={() => setTaskId(task.id)}
			className="flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-left transition-colors hover:border-border hover:bg-muted/30"
		>
			<span className="min-w-0 flex-1 truncate font-medium text-sm">
				{task.title}
			</span>
			<div className="flex shrink-0 items-center gap-2">
				{task.priority && (
					<Badge
						variant={getBadgeTaskPriorityColor(task.priority)}
						className="text-xs"
					>
						{task.priority}
					</Badge>
				)}
				{task.assignee && (
					<div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-medium text-[10px] text-primary">
						{task.assignee.name?.charAt(0).toUpperCase()}
					</div>
				)}
				{storyPoints != null && storyPoints > 0 && (
					<Badge variant="secondary" className="px-1.5 py-0 font-mono text-xs tabular-nums">
						{storyPoints}
					</Badge>
				)}
			</div>
		</button>
	);
};

export default function SprintListView({
	tasks
}: SprintListViewProps) {
	const orderedStatuses = columns.map((c) => c.id as TaskStatusEnum);

	return (
		<div className="h-full overflow-y-auto p-4">
			<div className="space-y-6">
				{orderedStatuses.map((status) => {
					const statusTasks = tasks.filter((t) => t.status === status);
					if (statusTasks.length === 0) return null;

					const column = columns.find((c) => c.id === status);

					return (
						<div key={status}>
							<div className="mb-2 flex items-center gap-2">
								<div
									className="h-2 w-2 rounded-full"
									style={{ backgroundColor: column?.color }}
								/>
								<span className="font-semibold text-sm">
									{statusDisplayName[status] ?? status}
								</span>
								<Badge variant="secondary" className="px-1.5 py-0 text-xs">
									{statusTasks.length}
								</Badge>
							</div>
							<div className="space-y-0.5 rounded-lg border bg-card/50 p-1">
								{statusTasks.map((task) => (
									<TaskRow key={task.id} task={task} />
								))}
							</div>
						</div>
					);
				})}

				{tasks.length === 0 && (
					<div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
						No tasks in this sprint
					</div>
				)}
			</div>
		</div>
	);
}
