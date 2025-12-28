import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Skeleton } from '~/common/components/ui/skeleton';

export function WeeklyInfoSkeleton() {
	return (
		<>
			{/* Mentorship Overview Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				{/* Weekly Sessions Card */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Weekly Sessions
						</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<Skeleton className="mb-2 h-8 w-12" />
						<Skeleton className="h-3 w-32" />
					</CardContent>
				</Card>

				{/* Remaining This Week Card */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Remaining This Week
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<Skeleton className="mb-2 h-8 w-12" />
						<Skeleton className="h-3 w-32" />
					</CardContent>
				</Card>

				{/* Next Reset Card */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Next Reset</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<Skeleton className="mb-2 h-8 w-24" />
						<Skeleton className="h-3 w-32" />
					</CardContent>
				</Card>
			</div>

			{/* Session Usage Progress Card */}
			<Card>
				<CardHeader>
					<CardTitle>Session Usage</CardTitle>
					<div className="text-muted-foreground text-sm">
						<Skeleton className="h-4 w-48" />
					</div>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-2 w-full" />
				</CardContent>
			</Card>
		</>
	);
}
