import { Card, CardContent, CardHeader } from '~/common/components/ui/card';
import { Skeleton } from '~/common/components/ui/skeleton';

export function SidebarSkeleton() {
	return (
		<div className="sticky top-24">
			{/* Main Card */}
			<Card className="border-0 shadow-lg">
				<CardHeader>
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent className="space-y-4 p-6">
					<div className="space-y-3">
						{/* Access Type */}
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-6 w-16 rounded-full" />
						</div>
						{/* Difficulty */}
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-6 w-20 rounded-full" />
						</div>
						{/* Credits Required */}
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-16" />
						</div>
						{/* Participants */}
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-12" />
						</div>
					</div>

					{/* Error Messages */}
					<div className="space-y-3">
						<Skeleton className="h-12 w-full rounded-lg" />
					</div>

					{/* Action Buttons */}
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-10 w-full" />
				</CardContent>
			</Card>

			{/* Mentor Info Card */}
			<Card className="mt-6 border-0 shadow-lg">
				<CardHeader>
					<Skeleton className="h-6 w-32" />
				</CardHeader>
				<CardContent>
					<Skeleton className="mb-4 h-12 w-full" />
					<Skeleton className="h-10 w-full" />
				</CardContent>
			</Card>
		</div>
	);
}
