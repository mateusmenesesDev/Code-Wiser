import type { TaskPriorityEnum } from '@prisma/client';
import { useQueryState } from 'nuqs';
import { Badge } from '~/common/components/ui/badge';
import {
	KanbanCard,
	type KanbanItemProps
} from '~/common/components/ui/kanban';
import { getBadgeTaskPriorityColor } from '~/common/utils/colorUtils';
import { AssigneeAvatars } from '~/features/task/components/AssigneeAvatars';
import { formatPublicTaskId } from '~/lib/publicTaskId';

export default function KanbanCardContent({ task }: { task: KanbanItemProps }) {
	const [, setTaskId] = useQueryState('taskId');
	const publicTaskId = formatPublicTaskId(
		task.project?.publicCode,
		task.publicNumber
	);

	return (
		<KanbanCard {...task} onTaskClick={() => setTaskId(task.id)}>
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
				<div className="flex items-center justify-between gap-2">
					<Badge
						variant={getBadgeTaskPriorityColor(
							task.priority as TaskPriorityEnum
						)}
					>
						{task.priority}
					</Badge>

					<AssigneeAvatars assignees={task.assignees ?? []} />
				</div>
			</div>{' '}
		</KanbanCard>
	);
}
