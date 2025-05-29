import { KanbanBoardSkeleton } from '~/features/workspace/components/board/KanbanBoardSkeleton';

export default function SkeletonDemoPage() {
	return (
		<div className="min-h-screen bg-background p-8">
			<div className="mx-auto max-w-7xl">
				<h1 className="mb-8 font-bold text-3xl">Kanban Board Skeleton Demo</h1>

				<KanbanBoardSkeleton />

				<div className="mt-8 text-center text-muted-foreground">
					<p>This is how the kanban board looks while loading!</p>
					<p className="mt-2 text-sm">
						The skeleton provides visual feedback during data fetching.
					</p>
				</div>
			</div>
		</div>
	);
}
