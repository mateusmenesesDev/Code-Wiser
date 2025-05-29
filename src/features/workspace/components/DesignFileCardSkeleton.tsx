import { Card, CardContent } from '~/common/components/ui/card';
import { Skeleton } from '~/common/components/ui/skeleton';

export function DesignFileCardSkeleton() {
	return (
		<Card className="mb-8 border-0 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg backdrop-blur-sm dark:from-purple-900/20 dark:to-pink-900/20">
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Skeleton className="h-12 w-12 rounded-lg" />
						<div>
							<Skeleton className="mb-2 h-5 w-24" />
							<Skeleton className="h-4 w-48" />
						</div>
					</div>
					<Skeleton className="h-10 w-32 rounded-md" />
				</div>
			</CardContent>
		</Card>
	);
}
