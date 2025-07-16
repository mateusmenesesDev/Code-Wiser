import type { TaskStatusEnum } from '@prisma/client';
import { ArrowUp, Calendar, Flag, Lock, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent } from '~/common/components/ui/card';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '~/common/components/ui/tooltip';
import { useDialog } from '~/common/hooks/useDialog';
import { stripHtmlTags } from '~/common/utils/cleanups';
import { getTaskPriorityColor } from '~/common/utils/colorUtils';
import type { TasksApiOutput } from '~/features/workspace/types/Task.type';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';

interface TaskCardProps {
	task: NonNullable<TasksApiOutput>[number];
	className?: string;
	columnId: TaskStatusEnum;
	index: number;
	projectId: string;
	onTaskClick: (task: NonNullable<TasksApiOutput>[number]) => void;
	moveTask: (
		taskId: string,
		fromColumnId: TaskStatusEnum,
		toColumnId: TaskStatusEnum,
		toIndex: number
	) => void;
}

export function TaskCard({
	task,
	className,
	columnId,
	index: _index,
	onTaskClick,
	moveTask: _moveTask
}: TaskCardProps) {
	const ref = useRef<HTMLDivElement>(null);

	const { data: userData } = api.user.getById.useQuery(
		task.assigneeId as string,
		{
			enabled: !!task.assigneeId
		}
	);

	const [{ isDragging }, drag] = useDrag({
		type: 'TASK',
		item: { id: task.id, columnId },
		collect: (monitor) => ({
			isDragging: monitor.isDragging()
		})
	});

	drag(ref);

	const { openDialog } = useDialog('task');

	const handleCardClick = (e: React.MouseEvent) => {
		if ((e.target as HTMLElement).closest('button')) {
			return;
		}
		onTaskClick(task);
		openDialog('task');
	};

	return (
		<Card
			ref={ref}
			className={cn(
				'mb-3 cursor-move select-none border bg-card/80 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-card/90 hover:shadow-lg',
				isDragging && 'rotate-2 opacity-50 shadow-lg',
				className
			)}
			onClick={handleCardClick}
		>
			<CardContent className="p-4">
				<div className="mb-2 flex items-center justify-between">
					<div className="flex items-center gap-2">
						{task.epicId && (
							<Badge
								variant="outline"
								className="border-blue-200 bg-blue-100 text-blue-800 text-xs dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
							>
								<ArrowUp className="mr-1 h-2 w-2" />
								{task.epic?.title || 'Epic'}
							</Badge>
						)}
						{task.blocked && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Badge
											variant="outline"
											className="border-red-200 bg-red-100 text-red-800 text-xs dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
										>
											<Lock className="mr-1 h-2 w-2" />
											Blocked
										</Badge>
									</TooltipTrigger>
									<TooltipContent>
										<p>{task.blockedReason || 'This task is blocked'}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
					<div className="flex items-center gap-1 text-muted-foreground">
						<div className="h-1 w-1 rounded-full bg-current" />
						<div className="h-1 w-1 rounded-full bg-current" />
						<div className="h-1 w-1 rounded-full bg-current" />
					</div>
				</div>

				<div className="mb-3 flex items-start justify-between">
					<h4 className="pr-2 font-medium text-card-foreground text-sm leading-5">
						{task.title}
					</h4>
					<Button
						variant="ghost"
						size="sm"
						className="h-6 w-6 flex-shrink-0 p-0"
						onMouseDown={(e) => {
							e.stopPropagation();
						}}
						onClick={(e) => {
							e.stopPropagation();
							// TODO: Handle menu actions
						}}
					>
						<MoreVertical className="h-3 w-3" />
					</Button>
				</div>

				<p className="mb-3 line-clamp-3 text-muted-foreground text-xs">
					{task.description ? stripHtmlTags(task.description) : ''}
				</p>

				<div className="mb-3 flex flex-wrap gap-1">
					{task.tags.map((tag) => (
						<Badge
							key={tag}
							variant="secondary"
							className="bg-muted/60 text-muted-foreground text-xs hover:bg-muted/80"
						>
							{tag}
						</Badge>
					))}
				</div>

				<div className="flex items-center justify-between">
					<Badge
						variant="outline"
						className={`text-xs ${getTaskPriorityColor(task.priority ?? '')}`}
					>
						<Flag className="mr-1 h-2 w-2" />
						{task.priority}
					</Badge>

					<div className="flex items-center gap-2 text-muted-foreground text-xs">
						{task.dueDate && (
							<div className="flex items-center gap-1">
								<Calendar className="h-3 w-3" />
								<span>{task.dueDate.toLocaleDateString()}</span>
							</div>
						)}
						<div className="flex items-center gap-1">
							<Image
								src={userData?.imageUrl ?? ''}
								alt={userData?.name ?? ''}
								width={26}
								height={26}
								className="rounded-full"
							/>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
