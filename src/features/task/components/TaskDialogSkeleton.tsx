import { Skeleton } from '~/common/components/ui/skeleton';

export function TaskDialogSkeleton() {
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Main Content Skeleton */}
				<div className="space-y-6 lg:col-span-2">
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-32 w-full" />
					</div>
					<Skeleton className="h-40 w-full rounded-lg" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-10 w-full" />
					</div>
				</div>

				{/* Sidebar Skeleton */}
				<div className="space-y-6 border-border border-l pl-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-10 w-full" />
					</div>
					<Skeleton className="h-32 w-full rounded-lg" />
				</div>
			</div>
			<div className="flex justify-end gap-2">
				<Skeleton className="h-10 w-20" />
				<Skeleton className="h-10 w-24" />
			</div>
		</div>
	);
}
