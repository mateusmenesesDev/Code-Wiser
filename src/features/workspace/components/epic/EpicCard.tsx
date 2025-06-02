'use client';

import { TaskStatusEnum } from '@prisma/client';
import {
	ChevronDown,
	ChevronRight,
	MoreHorizontal,
	PlusCircle
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import {
	Collapsible,
	CollapsibleContent
} from '~/common/components/ui/collapsible';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/common/components/ui/dropdown-menu';
import type { EpicWithTasks } from '../../../projects/types';
import { TaskCard } from '../tasks/TaskCard';

interface EpicCardProps {
	epic: EpicWithTasks;
}

export function EpicCard({ epic }: EpicCardProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Card>
			<CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						{isOpen ? (
							<ChevronDown className="h-4 w-4" />
						) : (
							<ChevronRight className="h-4 w-4" />
						)}
						<CardTitle>{epic.title}</CardTitle>
					</div>
					<div className="flex items-center space-x-2">
						<Badge variant="outline">{epic.tasks.length} tasks</Badge>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>Edit Epic</DropdownMenuItem>
								<DropdownMenuItem>Add Task</DropdownMenuItem>
								<DropdownMenuItem className="text-destructive">
									Delete Epic
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
				<CardDescription>{epic.description}</CardDescription>
			</CardHeader>
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleContent>
					<CardContent>
						<div className="space-y-2">
							{epic.tasks.map((task) => (
								<TaskCard
									key={task.id}
									task={task}
									columnId={TaskStatusEnum.BACKLOG}
									index={0}
									moveTask={() => {}}
								/>
							))}
							<Button variant="ghost" className="w-full" size="sm">
								<PlusCircle className="mr-2 h-4 w-4" />
								Add Task
							</Button>
						</div>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}
