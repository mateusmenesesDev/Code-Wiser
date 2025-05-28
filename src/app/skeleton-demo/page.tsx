import { KanbanColumnSkeleton } from '~/features/workspace/components/board/KanbanColumnSkeleton';

export default function SkeletonDemoPage() {
	return (
		<div className="min-h-screen bg-background p-8">
			<div className="mx-auto max-w-7xl">
				<h1 className="mb-8 font-bold text-3xl">Kanban Board Skeleton Demo</h1>

				<div className="grid h-[600px] auto-cols-fr grid-flow-col gap-4 overflow-x-auto">
					<div className="min-w-80">
						<KanbanColumnSkeleton taskCount={2} />
					</div>
					<div className="min-w-80">
						<KanbanColumnSkeleton taskCount={4} />
					</div>
					<div className="min-w-80">
						<KanbanColumnSkeleton taskCount={1} />
					</div>
					<div className="min-w-80">
						<KanbanColumnSkeleton taskCount={3} />
					</div>
				</div>

				<div className="mt-8 text-center text-muted-foreground">
					<p>This is how the kanban board looks while loading!</p>
					<p className="mt-2">
						The skeleton provides immediate visual feedback with animated
						placeholders.
					</p>
				</div>
			</div>
		</div>
	);
}
