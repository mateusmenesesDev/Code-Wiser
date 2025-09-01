import { TaskPriorityEnum } from '@prisma/client';
import { MoreVertical, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
import { Button } from '~/common/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/common/components/ui/dropdown-menu';
import { TableCell, TableRow } from '~/common/components/ui/table';
import type { SprintsApiOutput } from '~/features/sprints/types/Sprint.type';
import { useTask } from '~/features/workspace/hooks/useTask';
import { cn } from '~/lib/utils';
import type { TasksApiOutput } from '../../types/Task.type';
import { EpicCell } from './EpicCell';
import { PriorityCell } from './PriorityCell';
import { SprintCell } from './SprintCell';
import { TagsCell } from './TagsCell';

interface DraggableTaskRowProps {
	task: NonNullable<TasksApiOutput>[number];
	index: number;
	projectId: string;
	onTaskClick: (task: NonNullable<TasksApiOutput>[number]) => void;
	moveTask: (dragIndex: number, hoverIndex: number) => void;
	sprints?: SprintsApiOutput;
	epics?: Array<{ id: string; title: string }>;
}

interface DragItem {
	index: number;
	type: string;
}

export function DraggableTaskRow({
	task,
	index,
	projectId,
	onTaskClick,
	moveTask,
	sprints,
	epics
}: DraggableTaskRowProps) {
	const ref = useRef<HTMLTableRowElement>(null);
	const { deleteTask } = useTask({ projectId });

	const [{ isDragging }, drag] = useDrag({
		type: 'BACKLOG_TASK',
		item: { index, type: 'BACKLOG_TASK' },
		collect: (monitor) => ({
			isDragging: monitor.isDragging()
		})
	});

	const [, drop] = useDrop<DragItem>({
		accept: 'BACKLOG_TASK',
		hover(item, monitor) {
			if (!ref.current) {
				return;
			}
			const dragIndex = item.index;
			const hoverIndex = index;

			if (dragIndex === hoverIndex) {
				return;
			}

			const hoverBoundingRect = ref.current?.getBoundingClientRect();
			const hoverMiddleY =
				(hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
			const clientOffset = monitor.getClientOffset();

			if (!clientOffset) {
				return;
			}

			const hoverClientY = clientOffset.y - hoverBoundingRect.top;

			if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
				return;
			}
			if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
				return;
			}

			moveTask(dragIndex, hoverIndex);
			item.index = hoverIndex;
		}
	});

	drag(drop(ref));

	return (
		<TableRow
			ref={ref}
			className={cn(
				'cursor-move transition-all duration-200',
				isDragging && 'bg-muted/50 opacity-50 shadow-lg'
			)}
			aria-label={`Task: ${task.title}. Drag to reorder.`}
		>
			<TableCell className="text-center font-mono text-muted-foreground text-sm">
				{task.order ?? 0}
			</TableCell>
			<TableCell
				className="cursor-pointer transition-colors duration-150 hover:bg-muted/80"
				onClick={() => onTaskClick(task)}
			>
				{task.title}
			</TableCell>
			<TableCell>
				<PriorityCell
					priority={task.priority || TaskPriorityEnum.MEDIUM}
					id={task.id}
					projectId={projectId}
					isTemplate={true}
				/>
			</TableCell>
			<TableCell>
				<EpicCell
					epicId={task.epicId}
					taskId={task.id}
					projectId={projectId}
					epics={epics || []}
				/>
			</TableCell>
			<TableCell>
				<SprintCell
					sprintId={task.sprintId}
					taskId={task.id}
					projectId={projectId}
					sprints={sprints || []}
				/>
			</TableCell>
			<TableCell>
				<TagsCell tags={task.tags} taskId={task.id} projectId={projectId} />
			</TableCell>
			<TableCell>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0"
							onClick={(e) => {
								e.stopPropagation();
							}}
						>
							<MoreVertical className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-32">
						<ConfirmationDialog
							title="Delete Task"
							description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
							onConfirm={() => deleteTask(task.id)}
						>
							<DropdownMenuItem
								className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
								onSelect={(e) => {
									e.preventDefault();
								}}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete
							</DropdownMenuItem>
						</ConfirmationDialog>
					</DropdownMenuContent>
				</DropdownMenu>
			</TableCell>
		</TableRow>
	);
}
