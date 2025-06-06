import { ArrowLeft } from 'lucide-react';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent, CardHeader } from '~/common/components/ui/card';
import { Skeleton } from '~/common/components/ui/skeleton';

export function ProjectDetailSkeleton() {
	return (
		<div className="container mx-auto px-4 py-8">
			<Button variant="ghost" className="mb-6" disabled>
				<ArrowLeft className="mr-2 h-4 w-4" />
				Back to Projects
			</Button>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<div className="space-y-8 lg:col-span-2">
					<Card className="overflow-hidden shadow-lg [animation:pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
						<CardContent className="p-8">
							<div className="mb-4 flex items-start justify-between">
								<div className="flex-1">
									<Skeleton className="mb-2 h-9 w-3/4 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
									<div className="flex items-center gap-4">
										<Skeleton className="h-4 w-24 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
										<Skeleton className="h-4 w-20 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
										<Skeleton className="h-4 w-16 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
									</div>
								</div>
								<div className="flex gap-2">
									<Skeleton className="h-6 w-20 rounded-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
									<Skeleton className="h-6 w-16 rounded-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
								</div>
							</div>
							<Skeleton className="h-20 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
						</CardContent>
					</Card>

					<Card className="overflow-hidden shadow-lg [animation:pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
						<CardHeader>
							<div className="font-semibold text-2xl text-foreground leading-none tracking-tight">
								<Skeleton className="h-6 w-32 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
							</div>
						</CardHeader>
						<CardContent>
							<Skeleton className="mb-4 h-64 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
							<div className="grid grid-cols-4 gap-3">
								{Array.from({ length: 4 }).map((_, i) => (
									<Skeleton
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
										key={i}
										className="h-16 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5"
									/>
								))}
							</div>
						</CardContent>
					</Card>

					<Card className="overflow-hidden shadow-lg [animation:pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
						<CardContent className="p-6">
							<Skeleton className="mb-4 h-8 w-48 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
							<div className="space-y-4">
								<Skeleton className="h-32 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
								<Skeleton className="h-32 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
								<Skeleton className="h-32 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="lg:col-span-1">
					<Card className="border-0 shadow-lg [animation:pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
						<CardHeader>
							<div className="font-semibold text-2xl text-foreground leading-none tracking-tight">
								<Skeleton className="mx-auto h-8 w-32 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
							</div>
							<div className="text-muted-foreground text-sm">
								<Skeleton className="mx-auto h-4 w-48 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
							</div>
						</CardHeader>
						<CardContent className="space-y-4 p-6">
							<div className="space-y-3">
								{Array.from({ length: 4 }).map((_, i) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
										key={i}
										className="flex items-center justify-between"
									>
										<Skeleton className="h-4 w-20 bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
										<Skeleton className="h-6 w-16 rounded-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
									</div>
								))}
							</div>
							<Skeleton className="h-12 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
							<Skeleton className="h-10 w-full bg-gradient-to-r from-card-foreground/5 via-card-foreground/10 to-card-foreground/5" />
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
