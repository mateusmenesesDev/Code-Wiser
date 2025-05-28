'use client';

import { Card } from '~/common/components/ui/card';
import { ScrollArea } from '~/common/components/ui/scroll-area';
import { Skeleton } from '~/common/components/ui/skeleton';

export function SprintPlanningSkeleton() {
	return (
		<div className="py-6">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<Skeleton className="h-8 w-48" />
					<Skeleton className="mt-2 h-4 w-64" />
				</div>
				<Skeleton className="h-10 w-32" />
			</div>

			<Card>
				<ScrollArea className="h-[calc(100vh-12rem)]">
					<div className="space-y-4 p-4">
						{[...Array(3)].map((_, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							<Card key={index} className="p-4">
								<div className="space-y-3">
									<Skeleton className="h-6 w-32" />
									<Skeleton className="h-4 w-48" />
									<div className="flex items-center space-x-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-24" />
									</div>
								</div>
							</Card>
						))}
					</div>
				</ScrollArea>
			</Card>
		</div>
	);
}
