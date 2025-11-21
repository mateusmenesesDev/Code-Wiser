import { TaskPriorityEnum, type TaskStatusEnum } from '@prisma/client';
import { Filter, X } from 'lucide-react';
import { Button } from '~/common/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import type { RouterOutputs } from '~/trpc/react';
import { useKanbanFilters } from '~/features/kanban/hooks/useKanbanFilters';
import { ProjectStatsCards } from './ProjectStatsCards';

interface ProjectHeaderProps {
	members: RouterOutputs['project']['getMembers'];
	sprints: { id: string; title: string }[];
	stats: { status: TaskStatusEnum }[];
}

export default function ProjectHeader({
	members,
	sprints,
	stats
}: ProjectHeaderProps) {
	const {
		sprintFilter,
		priorityFilter,
		assigneeFilter,
		setSprintFilter,
		setPriorityFilter,
		setAssigneeFilter,
		clearFilters,
		hasActiveFilters
	} = useKanbanFilters();

	return (
		<div className="rounded-lg border-border/40 border-b bg-card p-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">Project Board</h1>
					<p className="text-muted-foreground text-sm">
						Manage your tasks across different stages
					</p>
				</div>
				<div className="flex flex-col">
					<ProjectStatsCards tasks={stats ?? []} />
					<div className="flex items-center gap-2">
						<Filter className="h-4 w-4 text-muted-foreground" />
						<span className="text-muted-foreground text-sm">Filters:</span>
						<Select
							value={assigneeFilter ?? 'all'}
							onValueChange={(value) =>
								setAssigneeFilter(value === 'all' ? 'all' : value)
							}
						>
							<SelectTrigger className="h-8 w-[180px]">
								<SelectValue placeholder="Assignee" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Assignees</SelectItem>
								{members?.map((member) => (
									<SelectItem key={member.id} value={member.id}>
										{member.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={priorityFilter ?? 'all'}
							onValueChange={(value) =>
								setPriorityFilter(
									value === 'all' ? 'all' : (value as TaskPriorityEnum)
								)
							}
						>
							<SelectTrigger className="h-8 w-[150px]">
								<SelectValue placeholder="Priority" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Priorities</SelectItem>
								{Object.values(TaskPriorityEnum).map(
									(priority: TaskPriorityEnum) => (
										<SelectItem key={priority} value={priority}>
											{priority}
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>
						<Select
							value={sprintFilter ?? 'all'}
							onValueChange={(value) =>
								setSprintFilter(value === 'all' ? 'all' : value)
							}
						>
							<SelectTrigger className="h-8 w-[180px]">
								<SelectValue placeholder="Sprint" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Sprints</SelectItem>
								{sprints
									?.sort((a, b) => a.title.localeCompare(b.title))
									.map((sprint) => (
										<SelectItem key={sprint.id} value={sprint.id}>
											{sprint.title}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
						{hasActiveFilters && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									clearFilters();
								}}
								className="h-8 gap-1"
							>
								<X className="h-3 w-3" />
								Clear
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
