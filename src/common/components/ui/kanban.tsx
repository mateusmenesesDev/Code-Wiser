'use client';

import type {
	Announcements,
	DndContextProps,
	DragEndEvent,
	DragOverEvent,
	DragStartEvent
} from '@dnd-kit/core';
import {
	type CollisionDetection,
	DndContext,
	DragOverlay,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	closestCenter,
	pointerWithin,
	useDroppable,
	useSensor,
	useSensors
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TaskStatusEnum } from '@prisma/client';
import {
	Fragment,
	type HTMLAttributes,
	type ReactNode,
	createContext,
	useContext,
	useState
} from 'react';
import { createPortal } from 'react-dom';
import { Card } from '~/common/components/ui/card';
import { ScrollArea, ScrollBar } from '~/common/components/ui/scroll-area';
import { cn } from '~/lib/utils';
import type { RouterOutputs } from '~/trpc/react';

export type { DragEndEvent } from '@dnd-kit/core';

export type KanbanItemProps = RouterOutputs['kanban']['getKanbanData'][number];

type KanbanColumnProps = {
	id: string;
	name: string;
} & Record<string, unknown>;

type KanbanContextProps<
	T extends KanbanItemProps = KanbanItemProps,
	C extends KanbanColumnProps = KanbanColumnProps
> = {
	columns: C[];
	data: T[];
	activeCardId: string | null;
};

const KanbanContext = createContext<KanbanContextProps>({
	columns: [],
	data: [],
	activeCardId: null
});

export type KanbanBoardProps = {
	id: string;
	children: ReactNode;
	className?: string;
};

export const KanbanBoard = ({ id, children, className }: KanbanBoardProps) => {
	const { isOver, setNodeRef } = useDroppable({
		id
	});

	return (
		<div
			className={cn(
				'flex size-full min-h-[200px] flex-col overflow-hidden rounded-xl border text-xs shadow-sm ring-2 transition-all duration-200',
				isOver
					? 'border-primary/60 bg-primary/5 shadow-lg ring-primary/40'
					: 'border-border/40 ring-transparent',
				className
			)}
			ref={setNodeRef}
		>
			{children}
		</div>
	);
};

export type KanbanCardProps<T extends KanbanItemProps = KanbanItemProps> = T & {
	children?: ReactNode;
	className?: string;
	onTaskClick?: () => void;
};

export const KanbanCard = <T extends KanbanItemProps = KanbanItemProps>({
	id,
	title,
	children,
	className,
	onTaskClick
}: KanbanCardProps<T>) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transition,
		transform,
		isDragging
	} = useSortable({
		id
	});
	const { activeCardId } = useContext(KanbanContext) as KanbanContextProps;

	const style = {
		transition,
		transform: CSS.Transform.toString(transform)
	};

	const handleClick = () => {
		// Only trigger click if no drag is active
		// The sensor activation constraint ensures drag doesn't start on quick clicks
		if (!activeCardId && onTaskClick) {
			onTaskClick();
		}
	};

	return (
		<div
			style={style}
			{...listeners}
			{...attributes}
			ref={setNodeRef}
			onClick={handleClick}
			className={cn('relative', isDragging && 'opacity-50')}
		>
			<Card
				className={cn(
					'group cursor-grab gap-4 rounded-lg border-border/50 bg-card p-3 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-border hover:shadow-md',
					isDragging && 'cursor-grabbing',
					className
				)}
			>
				{children ?? <p className="m-0 font-medium text-sm">{title}</p>}
			</Card>
		</div>
	);
};

export type KanbanCardsProps<T extends KanbanItemProps = KanbanItemProps> =
	Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'id'> & {
		children: (item: T) => ReactNode;
		id: string;
	};

export const KanbanCards = <T extends KanbanItemProps = KanbanItemProps>({
	children,
	className,
	...props
}: KanbanCardsProps<T>) => {
	const { data, activeCardId } = useContext(
		KanbanContext
	) as KanbanContextProps<T>;
	const filteredData = data.filter((item) => item.status === props.id);
	const items = filteredData.map((item) => item.id);
	const { isOver, setNodeRef } = useDroppable({
		id: props.id
	});

	return (
		<ScrollArea className="flex-1 overflow-hidden">
			<SortableContext items={items}>
				<div
					ref={setNodeRef}
					className={cn(
						'flex min-h-[120px] grow flex-col gap-2 p-3 transition-colors duration-200',
						isOver && activeCardId && 'bg-primary/5',
						className
					)}
					{...props}
				>
					{filteredData.length > 0 ? (
						filteredData.map((item) => (
							<Fragment key={item.id}>{children(item)}</Fragment>
						))
					) : (
						<div
							className={cn(
								'flex h-20 items-center justify-center rounded-lg border-2 border-dashed text-xs transition-all duration-200',
								isOver && activeCardId
									? 'border-primary/60 bg-primary/10 text-primary'
									: 'border-border/40 text-muted-foreground'
							)}
						>
							Drop tasks here
						</div>
					)}
				</div>
			</SortableContext>
			<ScrollBar orientation="vertical" />
		</ScrollArea>
	);
};

export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement>;

export const KanbanHeader = ({ className, ...props }: KanbanHeaderProps) => (
	<div
		className={cn(
			'sticky top-0 z-10 border-border/30 border-b bg-background/95 p-3 backdrop-blur-sm',
			className
		)}
		{...props}
	/>
);

export type KanbanProviderProps<
	T extends KanbanItemProps = KanbanItemProps,
	C extends KanbanColumnProps = KanbanColumnProps
> = Omit<DndContextProps, 'children'> & {
	children: (column: C) => ReactNode;
	className?: string;
	columns: C[];
	data: T[];
	onDataChange?: (data: T[]) => void;
	onDragStart?: (event: DragStartEvent) => void;
	onDragEnd?: (event: DragEndEvent) => void;
	onDragOver?: (event: DragOverEvent) => void;
};

export const KanbanProvider = <
	T extends KanbanItemProps = KanbanItemProps,
	C extends KanbanColumnProps = KanbanColumnProps
>({
	children,
	onDragStart,
	onDragEnd,
	onDragOver,
	className,
	columns,
	data,
	onDataChange,
	...props
}: KanbanProviderProps<T, C>) => {
	const [activeCardId, setActiveCardId] = useState<string | null>(null);
	const [activeCard, setActiveCard] = useState<T | null>(null);

	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 8 // Standard distance for reliable drag detection
			}
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 250,
				tolerance: 5
			}
		}),
		useSensor(KeyboardSensor)
	);

	// Optimized collision detection for better performance
	const collisionDetection: CollisionDetection = (args) => {
		// Use pointerWithin for columns (droppables) - faster and more accurate
		const pointerCollisions = pointerWithin(args);
		const columnIds = new Set(columns.map((col) => col.id));
		const droppableCollisions = pointerCollisions.filter((collision) =>
			columnIds.has(collision.id as string)
		);

		// If we're over a column, check for nearby cards for precise positioning
		if (droppableCollisions.length > 0) {
			const cardCollisions = closestCenter(args);
			// Prioritize cards for better positioning, but keep column for empty areas
			return cardCollisions.length > 0
				? [...cardCollisions, ...droppableCollisions]
				: droppableCollisions;
		}

		// Otherwise, use closestCenter for cards
		return closestCenter(args);
	};

	const handleDragStart = (event: DragStartEvent) => {
		const card = data.find((item) => item.id === event.active.id);
		if (card) {
			setActiveCardId(event.active.id as string);
			setActiveCard(card as T);
		}
		onDragStart?.(event);
	};

	const handleDragOver = (event: DragOverEvent) => {
		// Don't call onDataChange here - it causes multiple mutations during drag
		// Only handle visual feedback, actual updates happen in handleDragEnd
		onDragOver?.(event);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveCardId(null);
		setActiveCard(null);

		onDragEnd?.(event);

		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		let newData = [...data];

		const activeItem = newData.find((item) => item.id === active.id);
		const overItem = newData.find((item) => item.id === over.id);

		if (!activeItem) {
			return;
		}

		const activeColumn = activeItem.status;

		if (!activeColumn) {
			return; // Can't proceed without a valid status
		}

		// First check if over.id is a column ID (prioritize column detection)
		const overColumnId = columns.find((col) => col.id === over.id)?.id;

		let overColumn: TaskStatusEnum;
		if (overColumnId) {
			// Dropping directly on a column
			overColumn = overColumnId as TaskStatusEnum;
		} else if (overItem?.status) {
			// Dropping on another card - use that card's column
			overColumn = overItem.status as TaskStatusEnum;
		} else {
			// Fallback to active column (shouldn't happen)
			overColumn = activeColumn;
		}

		// Update status if moving to a different column
		if (activeColumn !== overColumn) {
			activeItem.status = overColumn;
		}

		// If dropping on another card (not directly on column), reorder within the column
		if (overItem && !overColumnId) {
			const oldIndex = newData.findIndex((item) => item.id === active.id);
			const newIndex = newData.findIndex((item) => item.id === over.id);
			if (oldIndex !== -1 && newIndex !== -1) {
				newData = arrayMove(newData, oldIndex, newIndex);
			}
		} else {
			// If dropping on a column directly, move the item to the end of that column
			const oldIndex = newData.findIndex((item) => item.id === active.id);
			if (oldIndex !== -1) {
				newData.splice(oldIndex, 1);
				// Find the last index of items in the target column
				let insertIndex = newData.length;
				for (let i = newData.length - 1; i >= 0; i--) {
					if (newData[i]?.status === overColumn) {
						insertIndex = i + 1;
						break;
					}
				}
				newData.splice(insertIndex, 0, activeItem);
			}
		}

		onDataChange?.(newData);
	};

	const announcements: Announcements = {
		onDragStart({ active }) {
			const { title, status } =
				data.find((item) => item.id === active.id) ?? {};

			return `Picked up the card "${title}" from the "${status}" column`;
		},
		onDragOver({ active, over }) {
			const { title } = data.find((item) => item.id === active.id) ?? {};
			const newStatus = columns.find((column) => column.id === over?.id)?.title;

			return `Dragged the card "${title}" over the "${newStatus}" column`;
		},
		onDragEnd({ active, over }) {
			const { title } = data.find((item) => item.id === active.id) ?? {};
			const newStatus = columns.find((column) => column.id === over?.id)?.title;

			return `Dropped the card "${title}" into the "${newStatus}" column`;
		},
		onDragCancel({ active }) {
			const { title, status } =
				data.find((item) => item.id === active.id) ?? {};

			return `Cancelled dragging the card "${title}" into the "${status}" column`;
		}
	};

	return (
		<KanbanContext.Provider value={{ columns, data, activeCardId }}>
			<DndContext
				accessibility={{ announcements }}
				collisionDetection={collisionDetection}
				onDragEnd={handleDragEnd}
				onDragOver={handleDragOver}
				onDragStart={handleDragStart}
				sensors={sensors}
				{...props}
			>
				<div
					className={cn(
						'grid size-full auto-cols-fr grid-flow-col gap-4 p-6',
						className
					)}
				>
					{columns.map((column) => children(column))}
				</div>
				{typeof window !== 'undefined' &&
					activeCard &&
					createPortal(
						<DragOverlay
							dropAnimation={{
								duration: 200,
								easing: 'ease-out'
							}}
							style={{
								cursor: 'grabbing',
								zIndex: 9999
							}}
						>
							<Card className="cursor-grabbing gap-4 rounded-lg border-2 border-primary/50 bg-card p-3 shadow-2xl ring-4 ring-primary/30">
								<p className="m-0 font-medium text-sm leading-snug">
									{activeCard.title}
								</p>
							</Card>
						</DragOverlay>,
						document.body
					)}
			</DndContext>
		</KanbanContext.Provider>
	);
};
