export const EpicListSkeleton = () => (
	<div className="space-y-4">
		{[1, 2, 3].map((i) => (
			<div
				key={i}
				className="animate-pulse rounded-lg border bg-white p-6 dark:bg-slate-950"
			>
				<div className="space-y-4">
					<div className="flex items-center gap-4">
						<div className="h-5 w-5 rounded-full bg-muted" />
						<div className="space-y-2">
							<div className="h-6 w-48 rounded-md bg-muted" />
							<div className="h-4 w-36 rounded-md bg-muted" />
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="h-6 w-20 rounded-md bg-muted" />
						<div className="h-6 w-24 rounded-md bg-muted" />
					</div>
				</div>
			</div>
		))}
	</div>
);
