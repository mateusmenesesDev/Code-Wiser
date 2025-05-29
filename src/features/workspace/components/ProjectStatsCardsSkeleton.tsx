import { CheckCircle, Clock, Target, TrendingUp } from 'lucide-react';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Skeleton } from '~/common/components/ui/skeleton';

export function ProjectStatsCardsSkeleton() {
	return (
		<section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Total Tasks</CardTitle>
					<Target className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<Skeleton className="mb-2 h-8 w-12" />
					<Skeleton className="h-3 w-24" />
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Completed</CardTitle>
					<CheckCircle className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<Skeleton className="mb-2 h-8 w-12" />
					<Skeleton className="h-3 w-20" />
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">In Progress</CardTitle>
					<Clock className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<Skeleton className="mb-2 h-8 w-12" />
					<Skeleton className="h-3 w-28" />
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Progress</CardTitle>
					<TrendingUp className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<Skeleton className="mb-2 h-8 w-16" />
					<Skeleton className="h-2 w-full" />
				</CardContent>
			</Card>
		</section>
	);
}
