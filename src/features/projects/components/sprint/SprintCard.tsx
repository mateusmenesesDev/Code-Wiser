'use client';

import {
	Calendar,
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
import { Progress } from '~/common/components/progress';
import type { Sprint } from '../../types';
import { TaskCard } from '../task/TaskCard';

interface SprintCardProps {
	sprint: Sprint;
}

export function SprintCard({ sprint }: SprintCardProps) {
	const [isOpen, setIsOpen] = useState(false);

	const completedTasks = sprint.tasks.filter(
		(task) => task.status === 'DONE'
	).length;
	const progress = (completedTasks / sprint.tasks.length) * 100 || 0;

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
						<CardTitle>{sprint.title}</CardTitle>
						<Badge
							variant={sprint.status === 'active' ? 'default' : 'secondary'}
						>
							{sprint.status}
						</Badge>
					</div>
					<div className="flex items-center space-x-2">
						<div className='flex items-center space-x-2 text-muted-foreground text-sm'>
							<Calendar className="h-4 w-4" />
							<span>
								{new Date(sprint.startDate).toLocaleDateString()} -{' '}
								{new Date(sprint.endDate).toLocaleDateString()}
							</span>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>Edit Sprint</DropdownMenuItem>
								<DropdownMenuItem>Start Sprint</DropdownMenuItem>
								<DropdownMenuItem>Complete Sprint</DropdownMenuItem>
								<DropdownMenuItem className="text-destructive">
									Delete Sprint
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
				{sprint.goal && <CardDescription>Goal: {sprint.goal}</CardDescription>}
				<div className="mt-2">
					<Progress value={progress} className="h-2 w-full" />
					<p className='mt-1 text-muted-foreground text-sm'>
						{completedTasks} of {sprint.tasks.length} tasks completed
					</p>
				</div>
			</CardHeader>
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleContent>
					<CardContent>
						<div className="space-y-2">
							{sprint.tasks.map((task) => (
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
