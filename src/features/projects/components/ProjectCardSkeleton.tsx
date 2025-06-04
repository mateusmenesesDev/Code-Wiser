import {
	Card,
	CardContent,
	CardFooter,
	CardHeader
} from '~/common/components/ui/card';
import { Skeleton } from '~/common/components/ui/skeleton';

export function ProjectCardSkeleton() {
	return (
		<Card className="group overflow-hidden border-0 shadow-md [animation:pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
			{/* Thumbnail Section */}
			<div className="relative overflow-hidden">
				<Skeleton className="h-48 w-full bg-gradient-to-br from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
				{/* Access Type Badge */}
				<div className="absolute top-3 right-3">
					<Skeleton className="h-6 w-16 rounded-full bg-gradient-to-r from-card-foreground/10 via-card-foreground/15 to-card-foreground/10" />
				</div>
			</div>

			{/* Header Section */}
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-3">
					{/* Project Title */}
					<Skeleton className="h-7 w-48 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
				</div>
				{/* Project Description - Two lines */}
				<Skeleton className="mt-2 h-4 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
				<Skeleton className="mt-1 h-4 w-3/4 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
			</CardHeader>

			{/* Content Section */}
			<CardContent className="space-y-4">
				{/* Category and Difficulty Badges */}
				<div className="flex items-center gap-2">
					<Skeleton className="h-6 w-24 rounded-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
					<Skeleton className="h-6 w-20 rounded-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
				</div>

				{/* Technologies */}
				<div className="flex flex-wrap gap-1">
					<Skeleton className="h-5 w-16 rounded-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
					<Skeleton className="h-5 w-20 rounded-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
					<Skeleton className="h-5 w-14 rounded-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
					<Skeleton className="h-5 w-18 rounded-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
				</div>

				{/* Project Info Row */}
				<div className="flex items-center justify-between text-sm">
					{/* Duration */}
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 w-4 rounded bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
						<Skeleton className="h-4 w-16 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
					</div>
					{/* Participants */}
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 w-4 rounded bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
						<Skeleton className="h-4 w-20 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
					</div>
				</div>

				{/* Credits */}
				<div className="flex items-center gap-2">
					<Skeleton className="h-4 w-4 rounded bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
					<Skeleton className="h-4 w-16 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
				</div>
			</CardContent>

			{/* Footer Section */}
			<CardFooter className="pt-0">
				<div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					{/* Primary Action Button */}
					<Skeleton className="h-9 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 sm:w-32" />
					{/* Secondary Action Button */}
					<Skeleton className="h-9 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5 sm:w-24" />
				</div>
			</CardFooter>
		</Card>
	);
}
