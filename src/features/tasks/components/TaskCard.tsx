'use client';

import { Clock, MoreHorizontal, Tag } from 'lucide-react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/common/components/ui/dropdown-menu';
import { cn } from '~/lib/utils';
import type { RouterOutputs } from '~/trpc/react';

interface TaskCardProps {
	task: RouterOutputs['sprint']['getAllByProjectSlug'][number]['tasks'][number];
	className?: string;
}

export function TaskCard({ task, className }: TaskCardProps) {
	return (
		<Card className={cn('mb-3 transition-all hover:shadow-md', className)}>
			<CardHeader className="p-3">
				<div className="flex items-center justify-between">
					<CardTitle className="font-medium text-sm">{task.title}</CardTitle>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="sm">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem>Edit</DropdownMenuItem>
							<DropdownMenuItem>Delete</DropdownMenuItem>
							<DropdownMenuItem>Move to...</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div className="mt-2 flex gap-2">
					{task.tags?.map((tag) => (
						<Badge key={tag} variant="secondary" className="text-xs">
							<Tag className="mr-1 h-3 w-3" />
							{tag}
						</Badge>
					))}
				</div>
			</CardHeader>
			<CardContent className="p-3 pt-0">
				<p className="text-muted-foreground text-xs">{task.description}</p>
				{task.dueDate && (
					<div className="mt-2 flex items-center text-muted-foreground text-xs">
						<Clock className="mr-1 h-3 w-3" />
						{new Date(task.dueDate).toLocaleDateString()}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
