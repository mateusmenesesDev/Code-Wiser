import {
	KanbanColumnSkeleton,
	SKELETON_COLUMN_CONFIGS
} from './KanbanColumnSkeleton';

export function KanbanBoardSkeleton() {
	return (
		<div className="h-full">
			<div className="grid h-[calc(100vh-40rem)] auto-cols-fr grid-flow-col gap-4 overflow-x-auto">
				{SKELETON_COLUMN_CONFIGS.map((column) => (
					<div key={column.id} className="min-w-80">
						<KanbanColumnSkeleton taskCount={column.taskCount} />
					</div>
				))}
			</div>
		</div>
	);
}
