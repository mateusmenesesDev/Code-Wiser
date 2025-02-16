'use client';

import {
	Calendar,
	ChevronDown,
	ChevronRight,
	MoreHorizontal,
	PlusCircle
} from 'lucide-react';
import { useState } from 'react';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
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
import { Progress } from '~/common/components/ui/progress';
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import type { RouterOutputs } from '~/trpc/react';
import { TaskCard } from '../../../tasks/components/TaskCard';
import { useSprint } from '../../hooks/sprint.hook';

interface SprintCardProps {
	sprint: RouterOutputs['sprint']['getAllByProjectSlug'][number];
	isTemplate?: boolean;
}

export function SprintCard({ sprint }: SprintCardProps) {
	const isTemplate = useIsTemplate();
	const [isOpen, setIsOpen] = useState(false);

	const completedTasks = sprint.tasks.filter(
		(task) => task.status === 'DONE'
	).length;
	const progress = (completedTasks / sprint.tasks.length) * 100 || 0;

	const projectSlug = isTemplate
		? (sprint.projectTemplateSlug as string)
		: (sprint.projectSlug as string);

	const { deleteSprint } = useSprint({
		projectSlug,
		isTemplate
	});

	const handleDelete = () => {
		deleteSprint.mutate({ id: sprint.id });
	};

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
					</div>
					<div className="flex items-center space-x-2">
						{!isTemplate && (
							<div className="flex items-center space-x-2 text-muted-foreground text-sm">
								<Calendar className="h-4 w-4" />
								<span>
									{sprint.startDate
										? new Date(sprint.startDate).toLocaleDateString()
										: 'N/A'}
									-{' '}
									{sprint.endDate
										? new Date(sprint.endDate).toLocaleDateString()
										: 'N/A'}
								</span>
							</div>
						)}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>Edit Sprint</DropdownMenuItem>
								{!isTemplate && (
									<>
										<DropdownMenuItem>Start Sprint</DropdownMenuItem>
										<DropdownMenuItem>Complete Sprint</DropdownMenuItem>
									</>
								)}
								<ConfirmationDialog
									title="Delete Sprint"
									description="Are you sure you want to delete this sprint?"
									onConfirm={handleDelete}
								>
									<div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-destructive text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
										Delete Sprint
									</div>
								</ConfirmationDialog>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
				{sprint.description && (
					<CardDescription>Goal: {sprint.description}</CardDescription>
				)}
				<div className="mt-2">
					<Progress value={progress} className="h-2 w-full" />
					<p className="mt-1 text-muted-foreground text-sm">
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
