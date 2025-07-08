import type { TaskStatusEnum } from '@prisma/client';
import { ArrowUp, Calendar, Flag, MoreVertical, User } from 'lucide-react';
import { useCallback, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { TaskDialog } from '~/common/components/task/TaskDialog';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent } from '~/common/components/ui/card';
import { useDialog } from '~/common/hooks/useDialog';
import { cn } from '~/lib/utils';
import type { RouterOutputs } from '~/trpc/react';
import { useComments } from '../../hooks/useComments';

interface TaskCardProps {
	task: RouterOutputs['sprint']['getAllByProjectId'][number]['tasks'][number];
	className?: string;
	columnId: TaskStatusEnum;
	index: number;
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
	moveTask: _moveTask
}: TaskCardProps) {
	const ref = useRef<HTMLDivElement>(null);
	const { comments, addComment, isAddingComment } = useComments({
		taskId: task.id
	});

	const [{ isDragging }, drag] = useDrag({
		type: 'TASK',
		item: { id: task.id, columnId },
		collect: (monitor) => ({
			isDragging: monitor.isDragging()
		})
	});

	drag(ref);

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'HIGHEST':
				return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
			case 'HIGH':
				return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
			case 'MEDIUM':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
			case 'LOW':
				return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
			case 'LOWEST':
				return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
		}
	};

	const { openDialog } = useDialog('task');

	const handleCardClick = (e: React.MouseEvent) => {
		if ((e.target as HTMLElement).closest('button')) {
			return;
		}
		openDialog('task');
	};

	const handleAddComment = useCallback(
		async (content: string): Promise<void> => {
			await addComment(content);
		},
		[addComment]
	);

	return (
		<>
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
						<Badge
							variant="outline"
							className="border-blue-200 bg-blue-100 text-blue-800 text-xs dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
						>
							{/* TODO: Change epic color */}
							<ArrowUp className="mr-1 h-2 w-2" />
							{/* TODO: Add epic name */}
							Epic (Coming Soon)
						</Badge>
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
						{task.description}
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
							className={`text-xs ${getPriorityColor(task.priority ?? '')}`}
						>
							<Flag className="mr-1 h-2 w-2" />
							{task.priority}
							{/* TODO: Quickly change priority */}
						</Badge>

						<div className="flex items-center gap-2 text-muted-foreground text-xs">
							{task.dueDate && (
								<div className="flex items-center gap-1">
									<Calendar className="h-3 w-3" />
									<span>{task.dueDate.toLocaleDateString()}</span>
								</div>
							)}
							<div className="flex items-center gap-1">
								{/* TODO: Add assignee name from user */}
								<User className="h-3 w-3" />
								<span>{task.assigneeId}</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<TaskDialog
				task={task}
				comments={comments}
				onAddComment={handleAddComment}
				isAddingComment={isAddingComment}
			/>
		</>
	);
}
