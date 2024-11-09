'use client';

import {
	ChevronDown,
	ChevronRight,
	MoreHorizontal,
	PlusCircle
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '~/common/components/badge';
import { Button } from '~/common/components/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/card';
import {
	Collapsible,
	CollapsibleContent
} from '~/common/components/collapsible';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/common/components/dropdown-menu';
import type { Epic } from '../../types';
import { TaskCard } from '../task/TaskCard';

interface EpicCardProps {
	epic: Epic;
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
						<Badge variant={epic.status === 'active' ? 'default' : 'secondary'}>
							{epic.status}
						</Badge>
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
								<TaskCard key={task.id} task={task} />
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
