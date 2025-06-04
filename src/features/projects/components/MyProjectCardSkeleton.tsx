import { Card, CardContent, CardHeader } from '~/common/components/ui/card';
import { Skeleton } from '~/common/components/ui/skeleton';

export function MyProjectCardSkeleton() {
	return (
		<Card className="transition-shadow [animation:pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] hover:shadow-lg">
			{/* Header Section */}
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex-1">
						{/* Project Title */}
						<Skeleton className="mb-2 h-7 w-48 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
						{/* Project Description - Two lines */}
						<Skeleton className="h-4 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
						<Skeleton className="mt-1 h-4 w-3/4 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
					</div>
					{/* Status Badge */}
					<Skeleton className="h-6 w-20 rounded-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
				</div>
			</CardHeader>

			{/* Content Section */}
			<CardContent className="space-y-4">
				{/* Progress Section */}
				<div>
					<div className="mb-2 flex items-center justify-between">
						<Skeleton className="h-4 w-16 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
						<Skeleton className="h-4 w-8 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
					</div>
					{/* Progress Bar */}
					<Skeleton className="h-2 w-full rounded-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
				</div>

				{/* Difficulty and Category Badges */}
				<div className="flex items-center justify-between">
					<Skeleton className="h-6 w-24 rounded-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
					<Skeleton className="h-6 w-20 rounded-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
				</div>

				{/* Start Date */}
				<div className="flex items-center gap-1">
					<Skeleton className="h-3 w-3 rounded bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
					<Skeleton className="h-4 w-32 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
				</div>

				{/* Last Activity */}
				<div className="flex items-center gap-1">
					<Skeleton className="h-3 w-3 rounded bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
					<Skeleton className="h-4 w-28 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
				</div>

				{/* Continue Project Button */}
				<Skeleton className="h-10 w-full rounded-md bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
			</CardContent>
		</Card>
	);
}
