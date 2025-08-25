import dayjs from 'dayjs';
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	GripVertical,
	ListTodo,
	Pencil,
	Plus,
	Target,
	Timer,
	Trash2
} from 'lucide-react';
import { useRef } from 'react';
import { type DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from '~/common/components/ui/accordion';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Progress } from '~/common/components/ui/progress';
import { cn } from '~/lib/utils';
import type { SprintApiOutput } from '../types/Sprint.type';

interface SprintItemProps {
	sprint: NonNullable<SprintApiOutput>;
	index: number;
	moveItem: (dragIndex: number, hoverIndex: number) => void;
	onDrop: () => void;
	onDragStart: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

interface DragItem {
	index: number;
	type: string;
}

export default function SprintItem({
	sprint,
	index,
	moveItem,
	onDrop,
	onDragStart,
	onEdit,
	onDelete
}: SprintItemProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [{ isDragging }, drag] = useDrag({
		type: 'SPRINT',
		item: () => {
			onDragStart();
			return { index, type: 'SPRINT' };
		},
		collect: (monitor) => ({
			isDragging: monitor.isDragging()
		}),
		end: (_item, monitor) => {
			if (monitor.didDrop()) {
				onDrop();
			}
		}
	});

	const [{ handlerId, isOver }, drop] = useDrop<
		DragItem,
		void,
		{ handlerId: string | symbol | null; isOver: boolean }
	>({
		accept: 'SPRINT',
		collect: (monitor) => ({
			handlerId: monitor.getHandlerId(),
			isOver: monitor.isOver()
		}),
		hover: (item: DragItem, monitor: DropTargetMonitor) => {
			if (!ref.current) return;

			const dragIndex = item.index;
			const hoverIndex = index;

			if (dragIndex === hoverIndex) return;

			const hoverBoundingRect = ref.current.getBoundingClientRect();
			const hoverMiddleY =
				(hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
			const clientOffset = monitor.getClientOffset();

			if (!clientOffset) return;

			const hoverClientY = clientOffset.y - hoverBoundingRect.top;

			// Only perform the move when the mouse has crossed half of the items height
			if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
			if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

			moveItem(dragIndex, hoverIndex);
			item.index = hoverIndex;
		}
	});

	drag(drop(ref));

	const totalTasks = sprint.tasks?.length || 0;
	const completedTasks =
		sprint.tasks?.filter((task) => task.status === 'DONE').length || 0;
	const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
	const hasDateRange = sprint.startDate && sprint.endDate;
	const isCompleted = totalTasks > 0 && completedTasks === totalTasks;

	return (
		<div
			className={cn(
				'group relative transition-all',
				isDragging && 'opacity-50'
			)}
			ref={ref}
			data-handler-id={handlerId}
		>
			{isOver && (
				<div className="-top-2 absolute inset-x-0 h-1 rounded-full bg-blue-500" />
			)}

			<AccordionItem
				value={sprint.id}
				className={cn(
					'relative border-0 bg-white transition-all dark:bg-slate-950',
					!isDragging && 'hover:shadow-md',
					isDragging && 'scale-[0.98] shadow-2xl',
					isOver && 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/10'
				)}
			>
				<div className="-translate-y-1/2 absolute top-1/2 left-2 cursor-move opacity-0 transition-opacity group-hover:opacity-100">
					<GripVertical
						className={cn(
							'h-5 w-5 text-muted-foreground',
							isDragging && 'text-blue-500'
						)}
					/>
				</div>

				<AccordionTrigger
					className={cn(
						'flex w-full gap-4 rounded-lg border px-10 py-4 transition-colors hover:no-underline',
						isCompleted
							? 'border-green-200 bg-green-50/30 hover:bg-green-50/50 dark:border-green-900/50 dark:bg-green-900/10 dark:hover:bg-green-900/20'
							: 'hover:bg-slate-50 dark:hover:bg-slate-900/50',
						isDragging &&
							'border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-900/10'
					)}
				>
					<div className="flex flex-1 items-center gap-4">
						<Timer
							className={cn(
								'h-5 w-5',
								isCompleted ? 'text-green-500' : 'text-blue-500'
							)}
						/>
						<div className="flex flex-1 items-center justify-between">
							<div className="space-y-1">
								<h3 className="font-semibold text-lg">{sprint.title}</h3>
								{hasDateRange && (
									<p className="flex items-center gap-2 text-muted-foreground text-sm">
										<Clock className="h-4 w-4" />
										<span>
											{sprint.startDate &&
												dayjs(sprint.startDate).format('MMM D')}{' '}
											-{' '}
											{sprint.endDate && dayjs(sprint.endDate).format('MMM D')}
										</span>
									</p>
								)}
							</div>
							<div className="flex items-center gap-6">
								<div className="flex items-center gap-4">
									<div className="flex items-center gap-2">
										<Target className="h-4 w-4 text-muted-foreground" />
										<span className="font-medium">{Math.round(progress)}%</span>
									</div>
									<Progress
										value={progress}
										className={cn(
											'h-2 w-24',
											isCompleted
												? 'bg-green-100 dark:bg-green-900/20 [&>div]:bg-green-500'
												: 'bg-blue-100 dark:bg-blue-900/20 [&>div]:bg-blue-500'
										)}
									/>
								</div>
								<div className="flex items-center gap-2">
									<Badge
										variant={isCompleted ? 'outline' : 'secondary'}
										className={cn(
											'rounded-md',
											isCompleted &&
												'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400'
										)}
									>
										<ListTodo className="mr-1 h-3 w-3" />
										{totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
									</Badge>
									{completedTasks > 0 && (
										<Badge
											variant="outline"
											className="rounded-md border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400"
										>
											<CheckCircle2 className="mr-1 h-3 w-3" />
											{completedTasks} completed
										</Badge>
									)}
								</div>
								<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
									<Button
										variant="ghost"
										size="sm"
										onClick={(e) => {
											e.stopPropagation();
											onEdit();
										}}
									>
										<Pencil className="h-4 w-4" />
									</Button>
									<ConfirmationDialog
										title="Delete Sprint"
										description={`Are you sure you want to delete "${sprint.title}"? ${totalTasks > 0 ? `This will remove the sprint association from ${totalTasks} task${totalTasks > 1 ? 's' : ''}.` : ''} This action cannot be undone.`}
										onConfirm={() => {
											onDelete();
										}}
									>
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
											}}
											className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</ConfirmationDialog>
								</div>
							</div>
						</div>
					</div>
				</AccordionTrigger>

				<AccordionContent className="px-4">
					{sprint.tasks?.length > 0 ? (
						<div className="space-y-2 py-4">
							{sprint.tasks.map((task) => (
								<div
									key={task.id}
									className={cn(
										'flex items-center justify-between rounded-lg border px-4 py-3 transition-colors',
										task.status === 'DONE'
											? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400'
											: 'hover:border-blue-200 hover:bg-blue-50/50 dark:hover:border-blue-900/50 dark:hover:bg-blue-900/10'
									)}
								>
									<div className="flex items-center gap-3">
										{task.status === 'DONE' ? (
											<CheckCircle2 className="h-4 w-4 text-green-500" />
										) : (
											<Clock className="h-4 w-4 text-blue-500" />
										)}
										<span className="font-medium">{task.title}</span>
									</div>
									{task.status === 'DONE' && (
										<Badge
											variant="secondary"
											className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
										>
											Done
										</Badge>
									)}
								</div>
							))}
						</div>
					) : (
						<div className="my-4 flex h-40 flex-col items-center justify-center gap-4 rounded-lg border border-dashed">
							<div className="flex flex-col items-center gap-2 text-center">
								<AlertCircle className="h-8 w-8 text-muted-foreground/50" />
								<p className="text-muted-foreground text-sm">
									No tasks in this sprint
								</p>
							</div>
							<Button
								variant="outline"
								onClick={onEdit}
								className="border-blue-200 bg-blue-50/50 text-blue-600 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
							>
								<Plus className="mr-2 h-4 w-4" />
								Add Task
							</Button>
						</div>
					)}
				</AccordionContent>
			</AccordionItem>
		</div>
	);
}
