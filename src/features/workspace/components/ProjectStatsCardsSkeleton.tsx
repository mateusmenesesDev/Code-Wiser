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
		<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<Card className="border-0 bg-card/50 shadow-lg backdrop-blur-sm">
				<CardHeader className="pb-3">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						Overall Progress
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3">
						<TrendingUp className="h-8 w-8 text-blue-600" />
						<div>
							<Skeleton className="mb-1 h-8 w-16" />
							<Skeleton className="h-2 w-20" />
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border-0 bg-card/50 shadow-lg backdrop-blur-sm">
				<CardHeader className="pb-3">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						Tasks Completed
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3">
						<CheckCircle className="h-8 w-8 text-green-600" />
						<div>
							<Skeleton className="mb-1 h-8 w-20" />
							<Skeleton className="h-3 w-16" />
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border-0 bg-card/50 shadow-lg backdrop-blur-sm">
				<CardHeader className="pb-3">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						In Progress
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3">
						<Target className="h-8 w-8 text-purple-600" />
						<div>
							<Skeleton className="mb-1 h-8 w-12" />
							<Skeleton className="h-3 w-20" />
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border-0 bg-card/50 shadow-lg backdrop-blur-sm">
				<CardHeader className="pb-3">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						Remaining Tasks
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3">
						<Clock className="h-8 w-8 text-orange-600" />
						<div>
							<Skeleton className="mb-1 h-8 w-12" />
							<Skeleton className="h-3 w-16" />
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
