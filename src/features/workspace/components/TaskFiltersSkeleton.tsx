import { Filter } from 'lucide-react';
import { Skeleton } from '~/common/components/ui/skeleton';

export function TaskFiltersSkeleton() {
	return (
		<div className="w-full">
			{/* Filter Controls Skeleton */}
			<div className="mb-6 rounded-lg border bg-card/30 p-4">
				<div className="flex flex-wrap items-center gap-4">
					<div className="flex items-center gap-2">
						<Filter className="h-4 w-4 text-muted-foreground" />
						<span className="font-medium text-sm">Filters:</span>
					</div>

					{/* Sprint Filter Skeleton */}
					<Skeleton className="h-10 w-48" />

					{/* Priority Filter Skeleton */}
					<Skeleton className="h-10 w-36" />

					{/* Assignee Filter Skeleton */}
					<Skeleton className="h-10 w-36" />

					{/* Clear Filters Button Skeleton */}
					<Skeleton className="h-8 w-24" />
				</div>

				{/* Filter Count Skeleton */}
				<div className="mt-2">
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
		</div>
	);
}
