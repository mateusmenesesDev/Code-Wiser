import type { TaskPriorityEnum } from '@prisma/client';
import { useQueryState } from 'nuqs';
import { Badge } from '~/common/components/ui/badge';
import {
	KanbanCard,
	type KanbanItemProps
} from '~/common/components/ui/kanban';
import { getBadgeTaskPriorityColor } from '~/common/utils/colorUtils';
import { AssigneeAvatars } from '~/features/task/components/AssigneeAvatars';
import { TaskBlockingStatus } from '~/features/task/components/TaskBlockingStatus';
import { TaskSubtasks } from '~/features/task/components/TaskSubtasks';
import { formatPublicTaskId } from '~/lib/publicTaskId';

export default function KanbanCardContent({
	task,
	projectId
}: {
	task: KanbanItemProps;
	projectId: string;
}) {
	const [, setTaskId] = useQueryState('taskId');
	const publicTaskId = formatPublicTaskId(
		task.project?.publicCode,
		task.publicNumber
	);
	const isBlocked = Boolean(task.blocked || task.blockedByTask);

	return (
		<KanbanCard
			{...task}
			onTaskClick={() => setTaskId(task.id)}
			className={
				isBlocked
					? 'border-warning/60 bg-warning-muted/30 hover:border-warning'
					: undefined
			}
		>
			<div className="flex flex-col gap-3">
				{publicTaskId && (
					<span className="font-mono text-muted-foreground text-xs">
						{publicTaskId}
					</span>
				)}
				{task.sprint && (
					<Badge
						variant="default"
						className="hidden w-fit border-info-border bg-info-muted text-info-muted-foreground text-xs xl:block"
					>
						{task.sprint.title}
					</Badge>
				)}
				<p className="m-0 line-clamp-2 font-medium text-sm leading-snug">
					{task.title}
				</p>
				<TaskBlockingStatus
					blocked={task.blocked}
					blockedReason={task.blockedReason}
					blockedByTask={task.blockedByTask}
					blockingTaskCount={task._count?.blockingTasks}
				/>
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<Badge
							variant={getBadgeTaskPriorityColor(
								task.priority as TaskPriorityEnum
							)}
						>
							{task.priority}
						</Badge>
						{task.storyPoints != null && task.storyPoints > 0 && (
							<Badge
								variant="secondary"
								className="px-1.5 py-0 font-mono text-xs tabular-nums"
							>
								{task.storyPoints}
							</Badge>
						)}
					</div>

					<AssigneeAvatars assignees={task.assignees ?? []} />
				</div>
				<TaskSubtasks
					parentTaskId={task.id}
					projectId={projectId}
					isTemplate={false}
					subtasks={task.subtasks}
					emptyAction="menu"
					openSubtasks
				/>
			</div>{' '}
		</KanbanCard>
	);
}
