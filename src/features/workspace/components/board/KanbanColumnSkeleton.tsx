import { Card, CardContent, CardHeader } from '~/common/components/ui/card';
import { Skeleton } from '~/common/components/ui/skeleton';

// Shared skeleton column configurations
export const SKELETON_COLUMN_CONFIGS = [
	{ id: 'skeleton-todo', taskCount: 2 },
	{ id: 'skeleton-progress', taskCount: 4 },
	{ id: 'skeleton-review', taskCount: 1 },
	{ id: 'skeleton-done', taskCount: 3 }
];

// Helper function to create skeleton task configurations
function createSkeletonTasks(count: number) {
	return Array.from({ length: count }, (_, index) => ({
		id: `skeleton-task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${index}`,
		isLong: index === 0,
		isShort: index === count - 1 && count > 1
	}));
}

export function KanbanColumnSkeleton({
	taskCount = 3
}: { taskCount?: number }) {
	const skeletonTasks = createSkeletonTasks(taskCount);

	return (
		<Card className="h-full border-0 bg-card/40 shadow-lg backdrop-blur-sm">
			<CardHeader className="border-b backdrop-blur-sm">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Skeleton className="h-6 w-20" />
						<Skeleton className="h-5 w-6 rounded-full" />
					</div>
					<Skeleton className="h-8 w-8 rounded" />
				</div>
			</CardHeader>
			<CardContent className="h-full p-4">
				<div className="space-y-3">
					{skeletonTasks.map((task) => (
						<TaskCardSkeleton
							key={task.id}
							isLong={task.isLong}
							isShort={task.isShort}
						/>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function TaskCardSkeleton({
	isLong = false,
	isShort = false
}: { isLong?: boolean; isShort?: boolean }) {
	return (
		<Card className="border bg-card/80 shadow-sm backdrop-blur-sm">
			<CardContent className="p-4">
				{/* Epic badge skeleton */}
				<div className="mb-2 flex items-center justify-between">
					<Skeleton className="h-5 w-28 rounded-full" />
					<Skeleton className="h-4 w-4" />
				</div>

				{/* Title and menu skeleton */}
				<div className="mb-3 flex items-start justify-between">
					<Skeleton
						className={`h-5 ${isShort ? 'w-1/2' : isLong ? 'w-5/6' : 'w-3/4'}`}
					/>
					<Skeleton className="h-6 w-6" />
				</div>

				{/* Description skeleton */}
				<div className="mb-3 space-y-2">
					<Skeleton className="h-3 w-full" />
					{!isShort && <Skeleton className="h-3 w-2/3" />}
					{isLong && <Skeleton className="h-3 w-1/2" />}
				</div>

				{/* Tags skeleton */}
				<div className="mb-3 flex gap-1">
					<Skeleton className="h-5 w-14 rounded-full" />
					{!isShort && <Skeleton className="h-5 w-18 rounded-full" />}
					{isLong && <Skeleton className="h-5 w-12 rounded-full" />}
				</div>

				{/* Footer skeleton */}
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-16 rounded-full" />
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 w-14" />
						<Skeleton className="h-4 w-10" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
