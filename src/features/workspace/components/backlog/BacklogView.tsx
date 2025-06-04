'use client';

import { ChevronRight, MoreHorizontal, Plus, Tag } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
import { CreateTaskDialog } from '~/common/components/task/CreateTaskDialog';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Checkbox } from '~/common/components/ui/checkbox';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger
} from '~/common/components/ui/dropdown-menu';
import { ScrollArea } from '~/common/components/ui/scroll-area';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';
import { useAnimate } from '~/common/hooks/useAnimate';
import { useDialog } from '~/common/hooks/useDialog';
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import { useTask } from '~/features/workspace/hooks/useTask';
import { api } from '~/trpc/react';
import { PriorityCell } from './PriorityCell';
import { SprintEpicCell } from './SprintEpicCell';

export function BacklogView() {
	const router = useRouter();
	const { openDialog } = useDialog('task');

	const handleNavigation = (route: string) => {
		if (isTemplate) {
			router.push(`/projects/templates/${slug}/edit/${route}`);
		} else {
			router.push(`/projects/${slug}/edit/${route}`);
		}
	};

	const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
	const isTemplate = useIsTemplate();
	const { slug } = useParams();
	const [parent] = useAnimate();

	const { data: project, isLoading } = isTemplate
		? api.projectTemplate.getBySlug.useQuery({
				slug: slug as string
			})
		: api.project.getBySlug.useQuery({
				slug: slug as string
			});

	// Fetch epics and sprints for the CreateTaskDialog
	const { data: epics = [] } = isTemplate
		? api.epic.getAllEpicsByProjectTemplateSlug.useQuery({
				projectTemplateSlug: slug as string
			})
		: api.epic.getAllEpicsByProjectId.useQuery({
				projectId: slug as string
			});

	const { data: sprints = [] } = isTemplate
		? api.sprint.getAllByProjectTemplateSlug.useQuery({
				projectTemplateSlug: slug as string
			})
		: api.sprint.getAllByProjectSlug.useQuery({
				projectSlug: slug as string
			});

	const { updateTask, deleteTask, bulkDeleteTasks } = useTask({
		projectSlug: slug as string
	});

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedTasks(project?.tasks.map((t) => t.id) ?? []);
		} else {
			setSelectedTasks([]);
		}
	};

	const handleSelectTask = (taskId: string, checked: boolean) => {
		if (checked) {
			setSelectedTasks((prev) => [...prev, taskId]);
		} else {
			setSelectedTasks((prev) => prev.filter((id) => id !== taskId));
		}
	};

	if (isLoading) return <div>Loading...</div>;

	if (!project) return null;

	return (
		<div className="h-full w-full" ref={parent}>
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					{selectedTasks.length > 0 && (
						<>
							<span className="text-muted-foreground text-sm">
								{selectedTasks.length} task(s) selected
							</span>
							<ConfirmationDialog
								title="Delete Tasks"
								description={`Are you sure you want to delete ${selectedTasks.length} task(s)?`}
								onConfirm={() => {
									bulkDeleteTasks(selectedTasks);
									setSelectedTasks([]);
								}}
							>
								<Button variant="destructive" size="sm">
									Delete Selected
								</Button>
							</ConfirmationDialog>
						</>
					)}
				</div>
				<Button
					onClick={() => openDialog('task')}
					className="flex items-center gap-2"
				>
					<Plus className="h-4 w-4" />
					Create Task
				</Button>
			</div>
			<ScrollArea className="h-[calc(100vh-15rem)]">
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[50px]">
									<Checkbox
										checked={selectedTasks.length === project?.tasks.length}
										onCheckedChange={handleSelectAll}
									/>
								</TableHead>
								{!isTemplate && (
									<TableHead className="w-[200px]">Assignee</TableHead>
								)}

								<TableHead className="min-w-[500px]">Task</TableHead>
								<TableHead className="w-[100px]">Priority</TableHead>
								<TableHead className="w-[200px]">Tags</TableHead>
								{project.methodology === 'SCRUM' && (
									<>
										<TableHead className="w-[150px]">Sprint</TableHead>
										<TableHead className="w-[150px]">Epic</TableHead>
									</>
								)}
								{!isTemplate && (
									<TableHead className="w-[100px]">Status</TableHead>
								)}
								<TableHead className="w-[70px]" />
							</TableRow>
						</TableHeader>
						<TableBody className="min-w-full table-fixed">
							{project.tasks.map((task) => (
								<TableRow key={task.id} className="group">
									<TableCell className="w-[50px]">
										<Checkbox
											checked={selectedTasks.includes(task.id)}
											onCheckedChange={(checked) =>
												handleSelectTask(task.id, checked as boolean)
											}
										/>
									</TableCell>
									{!isTemplate && (
										<TableCell className="w-[200px]">
											{task.assigneeId ? (
												<div className="flex items-center gap-2">
													<div className="h-6 w-6 rounded-full bg-muted" />
													<span className="truncate text-sm">
														{task.assigneeId}
													</span>
												</div>
											) : (
												<Button
													variant="ghost"
													size="sm"
													className="h-6 px-2 text-xs"
												>
													Assign
												</Button>
											)}
										</TableCell>
									)}
									<TableCell className="min-w-[500px]">
										<div className="flex items-center gap-2">
											<ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
											<div className="min-w-0 flex-1">
												<div className="truncate font-medium">{task.title}</div>
												<div className="truncate text-muted-foreground text-xs">
													{task.description}
												</div>
											</div>
										</div>
									</TableCell>
									<TableCell className="w-[100px]">
										<PriorityCell
											priority={task.priority ?? '-'}
											id={task.id}
											isTemplate={isTemplate}
											projectSlug={slug as string}
										/>
									</TableCell>
									<TableCell className="w-[200px]">
										<div className="flex flex-wrap gap-1">
											{task.tags?.map((tag) => (
												<Badge key={tag} variant="outline" className="text-xs">
													<Tag className="mr-1 h-3 w-3" />
													{tag}
												</Badge>
											))}
										</div>
									</TableCell>
									{project.methodology === 'SCRUM' && (
										<>
											<TableCell className="w-[150px]">
												{project.sprints && project.sprints.length > 0 ? (
													<SprintEpicCell
														type="sprint"
														value={task.sprintId}
														items={project.sprints}
														onUpdate={(sprintId) =>
															updateTask({
																id: task.id,
																sprintId: sprintId ?? undefined
															})
														}
													/>
												) : (
													<Button
														variant="outline"
														size="sm"
														className="h-7 w-[120px]"
														onClick={() => {
															handleNavigation('sprints');
														}}
													>
														Create Sprint
													</Button>
												)}
											</TableCell>
											<TableCell className="w-[150px]">
												{project.epics && project.epics.length > 0 ? (
													<SprintEpicCell
														type="epic"
														value={task.epicId}
														items={project.epics}
														onUpdate={(epicId) =>
															updateTask({
																id: task.id,
																epicId: epicId ?? undefined
															})
														}
													/>
												) : (
													<Button
														variant="outline"
														size="sm"
														className="h-7 w-[120px]"
														onClick={() => {
															handleNavigation('epics');
														}}
													>
														Create Epic
													</Button>
												)}
											</TableCell>
										</>
									)}
									{!isTemplate && (
										<TableCell className="w-[100px]">
											<Badge
												variant="outline"
												className="w-[80px] justify-center"
											>
												{task.status}
											</Badge>
										</TableCell>
									)}
									<TableCell className="w-[70px]">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
												>
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="p-0">
												<ConfirmationDialog
													title="Delete Task"
													description="Are you sure you want to delete this task?"
													onConfirm={() => deleteTask(task.id)}
												>
													<Button variant="destructive" className="w-full">
														Delete
													</Button>
												</ConfirmationDialog>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</ScrollArea>

			<CreateTaskDialog
				epics={epics}
				sprints={sprints}
				projectSlug={slug as string}
			/>
		</div>
	);
}
