'use client';

import { PlusCircle } from 'lucide-react';
import { Badge } from '~/common/components/badge';
import { Button } from '~/common/components/button';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/common/components/tooltip';

interface ColumnHeaderProps {
	title: string;
	count: number;
	onAddTask?: () => void;
}

export function ColumnHeader({ title, count, onAddTask }: ColumnHeaderProps) {
	return (
		<div className="mb-2 flex items-center justify-between">
			<div className="flex items-center">
				<h3 className="font-medium text-sm">{title}</h3>
				<Badge variant="secondary" className="ml-2">
					{count}
				</Badge>
			</div>
			{onAddTask && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="ghost" size="sm" onClick={onAddTask}>
							<PlusCircle className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Add task to {title}</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
}
