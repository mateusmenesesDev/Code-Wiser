import type { TaskPriorityEnum } from '@prisma/client';
import Image from 'next/image';
import { useQueryState } from 'nuqs';
import { Badge } from '~/common/components/ui/badge';
import {
	KanbanCard,
	type KanbanItemProps
} from '~/common/components/ui/kanban';
import { getBadgeTaskPriorityColor } from '~/common/utils/colorUtils';
import { api } from '~/trpc/react';

export default function KanbanCardContent({ task }: { task: KanbanItemProps }) {
	const [, setTaskId] = useQueryState('taskId');
	const { data: assigneeImage } = api.task.getAssigneeImage.useQuery({
		assigneeId: task.assignee?.id as string
	});

	return (
		<KanbanCard {...task} onTaskClick={() => setTaskId(task.id)}>
			<div className="flex flex-col gap-3">
				{task.sprint && (
					<Badge
						variant="default"
						className="hidden w-fit border-blue-200 bg-blue-100 text-blue-800 text-xs xl:block dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
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

					{task.assignee && (
						<div className="flex items-center gap-1.5">
							{assigneeImage ? (
								<Image
									src={assigneeImage}
									alt={task.assignee.name ?? 'Assignee'}
									className="rounded-full"
									width={20}
									height={20}
								/>
							) : (
								<div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 font-medium text-[10px] text-primary">
									{task.assignee.name?.charAt(0).toUpperCase()}
								</div>
							)}
						</div>
					)}
				</div>
			</div>{' '}
		</KanbanCard>
	);
}
