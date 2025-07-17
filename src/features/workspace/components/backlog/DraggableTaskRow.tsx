import { TaskPriorityEnum } from '@prisma/client';
import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { TableCell, TableRow } from '~/common/components/ui/table';
import type { EpicsApiOutput } from '~/features/epics/types/Epic.type';
import type { SprintsApiOutput } from '~/features/sprints/types/Sprint.type';
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
	epics?: EpicsApiOutput;
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
			className={cn('cursor-move', isDragging && 'bg-muted opacity-50')}
		>
			<TableCell
				className="cursor-pointer hover:bg-muted/80"
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
		</TableRow>
	);
}
