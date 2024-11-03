export function ProjectCardSkeleton() {
	return (
		<output
			className="block rounded-lg border bg-card text-card-foreground shadow-sm"
			aria-label="Loading project"
		>
			<div className="relative">
				{/* Image skeleton */}
				<div
					className="h-48 w-full animate-pulse rounded-t-lg bg-muted"
					aria-hidden="true"
				/>
			</div>
			<div className="space-y-4 p-6">
				{/* Title skeleton */}
				<div
					className="h-6 w-3/4 animate-pulse rounded bg-muted"
					aria-hidden="true"
				/>

				{/* Description skeleton */}
				<div className="space-y-2">
					<div
						className="h-4 w-full animate-pulse rounded bg-muted"
						aria-hidden="true"
					/>
					<div
						className="h-4 w-5/6 animate-pulse rounded bg-muted"
						aria-hidden="true"
					/>
				</div>

				{/* Tags skeleton */}
				<div className="flex flex-wrap gap-2">
					<div
						className="h-6 w-16 animate-pulse rounded-full bg-muted"
						aria-hidden="true"
					/>
					<div
						className="h-6 w-20 animate-pulse rounded-full bg-muted"
						aria-hidden="true"
					/>
					<div
						className="h-6 w-14 animate-pulse rounded-full bg-muted"
						aria-hidden="true"
					/>
				</div>

				{/* Footer skeleton */}
				<div className="flex items-center justify-between pt-4">
					<div
						className="h-4 w-24 animate-pulse rounded bg-muted"
						aria-hidden="true"
					/>
					<div
						className="h-9 w-24 animate-pulse rounded bg-muted"
						aria-hidden="true"
					/>
				</div>
			</div>
			<div className="sr-only">Loading project card...</div>
		</output>
	);
}
