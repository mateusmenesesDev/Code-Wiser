import { Skeleton } from '~/common/components/ui/skeleton';

export function TaskCommentsSkeleton() {
	return (
		<div className="space-y-3">
			{/* Comment items skeleton */}
			{[1, 2, 3].map((i) => (
				<div key={i} className="flex gap-3">
					<Skeleton className="h-8 w-8 rounded-full" />
					<div className="flex-1 space-y-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-3 w-16" />
							</div>
						</div>
						<Skeleton className="h-16 w-full" />
					</div>
				</div>
			))}
		</div>
	);
}

