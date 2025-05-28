import { Card, CardContent, CardHeader } from '~/common/components/ui/card';
import { Skeleton } from '~/common/components/ui/skeleton';

export function KanbanColumnSkeleton({
	taskCount = 3
}: { taskCount?: number }) {
	const variants: Array<'short' | 'medium' | 'long'> = [
		'short',
		'medium',
		'long'
	];

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
					{/* Task card skeletons with variety */}
					{Array.from({ length: taskCount }).map((_, index) => (
						<TaskCardSkeleton
							key={`kanban-task-skeleton-${taskCount}-${
								// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
								index
							}`}
							variant={variants[index % variants.length]}
						/>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function TaskCardSkeleton({
	variant = 'medium'
}: { variant?: 'short' | 'medium' | 'long' }) {
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
						className={`h-5 ${variant === 'short' ? 'w-1/2' : variant === 'long' ? 'w-5/6' : 'w-3/4'}`}
					/>
					<Skeleton className="h-6 w-6" />
				</div>

				{/* Description skeleton */}
				<div className="mb-3 space-y-2">
					<Skeleton className="h-3 w-full" />
					{variant !== 'short' && <Skeleton className="h-3 w-2/3" />}
					{variant === 'long' && <Skeleton className="h-3 w-1/2" />}
				</div>

				{/* Tags skeleton */}
				<div className="mb-3 flex gap-1">
					<Skeleton className="h-5 w-14 rounded-full" />
					{variant !== 'short' && (
						<Skeleton className="h-5 w-18 rounded-full" />
					)}
					{variant === 'long' && <Skeleton className="h-5 w-12 rounded-full" />}
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
