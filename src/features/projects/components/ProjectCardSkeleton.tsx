import {
	Card,
	CardContent,
	CardFooter,
	CardHeader
} from '~/common/components/card';
import { Skeleton } from '~/common/components/skeleton';

export function ProjectCardSkeleton() {
	return (
		<Card className="flex flex-col [animation:pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
			{/* Header Section */}
			<CardHeader className="pb-4">
				{/* Title and Badge */}
				<div className="flex items-center justify-between">
					{/* Project Title */}
					<Skeleton className="h-7 w-48 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 dark:from-card-foreground/5 dark:via-card-foreground/10 dark:to-card-foreground/5" />
					{/* Difficulty Badge */}
					<Skeleton className="h-6 w-20 rounded-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 dark:from-card-foreground/5 dark:via-card-foreground/10 dark:to-card-foreground/5" />
				</div>
				{/* Project Description - Two lines */}
				<Skeleton className="mt-2 h-4 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 dark:from-card-foreground/5 dark:via-card-foreground/10 dark:to-card-foreground/5" />
				<Skeleton className="mt-2 h-4 w-3/4 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 dark:from-card-foreground/5 dark:via-card-foreground/10 dark:to-card-foreground/5" />
			</CardHeader>

			{/* Content Section */}
			<CardContent className="pb-4">
				{/* Project Stats Row */}
				<div className="flex flex-wrap items-center gap-3">
					{/* Category Badge */}
					<Skeleton className="h-6 w-24 rounded-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 dark:from-card-foreground/5 dark:via-card-foreground/10 dark:to-card-foreground/5" />
					{/* Participants Count */}
					<Skeleton className="h-5 w-32 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 dark:from-card-foreground/5 dark:via-card-foreground/10 dark:to-card-foreground/5" />
					{/* Credits Info */}
					<Skeleton className="h-5 w-24 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 dark:from-card-foreground/5 dark:via-card-foreground/10 dark:to-card-foreground/5" />
				</div>
			</CardContent>

			{/* Footer Section */}
			<CardFooter className="mt-auto flex flex-col items-stretch gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
				{/* Status Badge */}
				<Skeleton className="h-9 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 sm:w-32 dark:from-card-foreground/5 dark:via-card-foreground/10 dark:to-card-foreground/5" />
				{/* Action Buttons */}
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					{/* Primary Action Button (Start/Continue) */}
					<Skeleton className="h-9 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 sm:w-24 dark:from-card-foreground/5 dark:via-card-foreground/10 dark:to-card-foreground/5" />
					{/* Secondary Action Button (See More) */}
					<Skeleton className="h-9 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 sm:w-24 dark:from-card-foreground/5 dark:via-card-foreground/10 dark:to-card-foreground/5" />
				</div>
			</CardFooter>
		</Card>
	);
}
