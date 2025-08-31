import { CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Skeleton } from '~/common/components/ui/skeleton';

export function ProjectStatsCardsSkeleton() {
	return (
		<div className="ml-auto flex w-fit flex-wrap items-center justify-end gap-6 rounded-lg bg-card/30 p-3 text-sm">
			<div className="flex items-center gap-2">
				<TrendingUp className="h-4 w-4 text-blue-600" />
				<Skeleton className="h-4 w-8" />
				<span className="text-muted-foreground text-sm">%</span>
			</div>

			<div className="flex items-center gap-2">
				<CheckCircle className="h-4 w-4 text-green-600" />
				<Skeleton className="h-4 w-6" />
				<span className="text-muted-foreground text-sm">done</span>
			</div>

			<div className="flex items-center gap-2">
				<Clock className="h-4 w-4 text-orange-600" />
				<Skeleton className="h-4 w-6" />
				<span className="text-muted-foreground text-sm">active</span>
			</div>

			<div className="flex items-center gap-2">
				<Clock className="h-4 w-4 text-gray-600" />
				<Skeleton className="h-4 w-6" />
				<span className="text-muted-foreground text-sm">left</span>
			</div>
		</div>
	);
}
