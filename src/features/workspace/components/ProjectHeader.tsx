import { Protect } from '@clerk/nextjs';
import {
	ProjectMethodologyEnum,
	TaskPriorityEnum,
	type TaskStatusEnum
} from '@prisma/client';
import {
	Figma,
	Filter,
	LayoutGrid,
	List as ListIcon,
	Play,
	Plus,
	Search,
	Settings,
	X
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/common/components/ui/button';
import { Input } from '~/common/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { useKanbanFilters } from '~/features/kanban/hooks/useKanbanFilters';
import { TaskSelectionDialog } from '~/features/planningPoker/components/TaskSelectionDialog';
import { cn } from '~/lib/utils';
import type { RouterOutputs } from '~/trpc/react';
import { ProjectStatsCards } from './ProjectStatsCards';

interface ProjectHeaderProps {
	projectId: string;
	members: RouterOutputs['project']['getMembers'];
	sprints: { id: string; title: string }[];
	epics: { id: string; title: string }[];
	stats: { status: TaskStatusEnum }[];
	projectTitle: string;
	projectFigmaUrl: string;
	methodology: ProjectMethodologyEnum;
	onCreateTask: () => void;
	onOpenSettings: () => void;
	mainView?: 'board' | 'list';
	onMainViewChange?: (view: 'board' | 'list') => void;
	showMainViewToggle?: boolean;
}

export default function ProjectHeader({
	projectId,
	members,
	sprints,
	stats,
	projectTitle,
	projectFigmaUrl,
	methodology,
	epics,
	onCreateTask,
	onOpenSettings,
	mainView,
	onMainViewChange,
	showMainViewToggle = false
}: ProjectHeaderProps) {
	const [isPlanningPokerDialogOpen, setIsPlanningPokerDialogOpen] =
		useState(false);
	const {
		sprintFilter,
		epicFilter,
		priorityFilter,
		assigneeFilter,
		searchFilter,
		setSprintFilter,
		setEpicFilter,
		setPriorityFilter,
		setAssigneeFilter,
		setSearchFilter,
		clearFilters,
		hasActiveFilters
	} = useKanbanFilters();

	return (
		<div className="rounded-lg border-border/40 border-b bg-card p-4">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="space-y-0.5">
					<div className="flex items-center gap-2">
						<h1 className="font-bold text-2xl">{projectTitle}</h1>
						<span className="rounded-full border px-2 py-0.5 text-muted-foreground text-xs">
							{methodology === ProjectMethodologyEnum.SCRUM
								? 'Scrum'
								: 'Kanban'}
						</span>
						{showMainViewToggle && mainView && onMainViewChange && (
							<div className="flex items-center rounded-lg border bg-muted p-0.5">
								<Button
									variant="ghost"
									size="sm"
									className={cn(
										'h-7 gap-1.5 px-2',
										mainView === 'board' && 'bg-background shadow-sm'
									)}
									onClick={() => onMainViewChange('board')}
									aria-pressed={mainView === 'board'}
								>
									<LayoutGrid className="h-3.5 w-3.5" />
									<span className="text-xs">Board</span>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className={cn(
										'h-7 gap-1.5 px-2',
										mainView === 'list' && 'bg-background shadow-sm'
									)}
									onClick={() => onMainViewChange('list')}
									aria-pressed={mainView === 'list'}
								>
									<ListIcon className="h-3.5 w-3.5" />
									<span className="text-xs">List</span>
								</Button>
							</div>
						)}
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={onOpenSettings}
							aria-label="Project settings"
						>
							<Settings className="h-4 w-4" />
						</Button>
					</div>
					<p className="text-muted-foreground text-sm">
						Manage your tasks across different stages
					</p>
					<div className="flex gap-2">
						<Button
							data-testid="create-task-button"
							variant="outline"
							size="sm"
							className="gap-2"
							onClick={onCreateTask}
						>
							<Plus className="h-4 w-4" />
							Create Task
						</Button>
						{projectFigmaUrl && (
							<a
								href={projectFigmaUrl}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Button variant="primary" size="sm" className="gap-2">
									<Figma className="h-4 w-4" />
									Open in Figma
								</Button>
							</a>
						)}
						{/* biome-ignore lint/a11y/useValidAriaRole: <explanation> */}
						<Protect role="org:admin">
							<Button
								variant="outline"
								size="sm"
								className="gap-2"
								onClick={() => setIsPlanningPokerDialogOpen(true)}
							>
								<Play className="h-4 w-4" />
								Start Planning Poker
							</Button>
						</Protect>
					</div>
				</div>
				<div className="flex min-w-0 flex-col items-end gap-3">
					<ProjectStatsCards tasks={stats ?? []} />
					<div className="flex flex-wrap items-center justify-end gap-2">
						<div className="relative w-full sm:w-[220px]">
							<Search className="absolute top-2 left-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								aria-label="Search tasks"
								placeholder="Search tasks..."
								value={searchFilter}
								onChange={(event) => setSearchFilter(event.target.value)}
								className="h-8 pl-8"
							/>
						</div>
						<Filter className="h-4 w-4 text-muted-foreground" />
						<span className="text-muted-foreground text-sm">Filters:</span>
						<Select
							value={assigneeFilter ?? 'all'}
							onValueChange={(value) => setAssigneeFilter(value)}
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
								setPriorityFilter(value as TaskPriorityEnum | 'all')
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
							onValueChange={(value) => setSprintFilter(value)}
						>
							<SelectTrigger className="h-8 w-[180px]">
								<SelectValue placeholder="Sprint" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Sprints</SelectItem>
								{sprints
									.slice()
									.sort((a, b) => a.title.localeCompare(b.title))
									.map((sprint) => (
										<SelectItem key={sprint.id} value={sprint.id}>
											{sprint.title}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
						{epics.length > 0 && (
							<Select
								value={epicFilter ?? 'all'}
								onValueChange={(value) => setEpicFilter(value)}
							>
								<SelectTrigger className="h-8 w-[180px]">
									<SelectValue placeholder="Epic" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Epics</SelectItem>
									{epics
										.slice()
										.sort((a, b) => a.title.localeCompare(b.title))
										.map((epic) => (
											<SelectItem key={epic.id} value={epic.id}>
												{epic.title}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						)}
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
			<TaskSelectionDialog
				projectId={projectId}
				open={isPlanningPokerDialogOpen}
				onOpenChange={setIsPlanningPokerDialogOpen}
			/>
		</div>
	);
}
