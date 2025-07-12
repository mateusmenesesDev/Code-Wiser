import { Skeleton } from '~/common/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';

export function BacklogSkeleton() {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl">Backlog</h2>
				<Skeleton className="h-9 w-[100px]" />
			</div>

			<Table className="border">
				<TableHeader>
					<TableRow>
						<TableHead>Title</TableHead>
						<TableHead>Priority</TableHead>
						<TableHead>Epic</TableHead>
						<TableHead>Sprint</TableHead>
						<TableHead>Tags</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{Array.from({ length: 5 }).map((_, index) => (
						<TableRow key={`skeleton-row-${index + 1}`}>
							<TableCell>
								<Skeleton className="h-5 w-[200px]" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-5 w-[100px]" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-5 w-[150px]" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-5 w-[150px]" />
							</TableCell>
							<TableCell>
								<div className="flex gap-1">
									<Skeleton className="h-5 w-[60px]" />
									<Skeleton className="h-5 w-[60px]" />
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
