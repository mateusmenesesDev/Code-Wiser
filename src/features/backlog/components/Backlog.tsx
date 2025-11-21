'use client';

import { TaskStatusEnum } from '@prisma/client';
import { Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from '~/common/components/ui/accordion';
import { Button } from '~/common/components/ui/button';
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';
import { useDialog } from '~/common/hooks/useDialog';
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import { useSprintQueries } from '~/features/sprints/hooks/useSprintQueries';
import { TaskDialog } from '~/features/task/components/TaskDialog';
import { api } from '~/trpc/react';
import { useTask } from '~/features/task/hooks/useTask';
import type { TasksApiOutput } from '~/features/workspace/types/Task.type';
import { DraggableTaskRow } from './DraggableTaskRow';

/**
 * Backlog Component
 *
 * Displays tasks in a table format with drag-and-drop reordering capabilities.
 * Features:
 * - Drag and drop to reorder tasks
 * - Optimistic updates for immediate UI feedback
 * - Inline editing of task properties (priority, epic, sprint, tags)
 * - Task creation and deletion
 *
 * The order column shows the current position of each task in the backlog.
 * Tasks can be reordered by dragging them to different positions.
 */
export default function Backlog({ projectId }: { projectId: string }) {
	const { id } = useParams();
	const { openDialog } = useDialog('task');
	const isTemplate = useIsTemplate();
	const [selectedTask, setSelectedTask] = useState<
		NonNullable<TasksApiOutput>[number] | null
	>(null);

	const { getAllSprints } = useSprintQueries();
	const { updateTaskOrders, getAllTasksByProjectId } = useTask({ projectId });

	const [sprints] = getAllSprints();

	const [tasks] = getAllTasksByProjectId(projectId);

	const [projectData] = isTemplate
		? api.projectTemplate.getById.useSuspenseQuery({ id: projectId })
		: api.project.getById.useSuspenseQuery({ id: projectId });

	const handleCreateTask = useCallback(() => {
		setSelectedTask(null);
		openDialog('task');
	}, [openDialog]);

	const handleTaskClick = useCallback(
		(task: NonNullable<TasksApiOutput>[number]) => {
			setSelectedTask(task);
			openDialog('task');
		},
		[openDialog]
	);

	const moveTask = useCallback(
		(dragIndex: number, hoverIndex: number, groupTaskIds?: string[]) => {
			if (dragIndex === hoverIndex) return;

			const allBacklog =
				tasks?.filter((task) => task.status === TaskStatusEnum.BACKLOG) ?? [];

			const groupTasks = (
				groupTaskIds?.length
					? allBacklog.filter((t) => groupTaskIds.includes(t.id))
					: allBacklog.filter((t) => !t.sprintId)
			).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

			if (groupTasks.length === 0) return;

			const updates = groupTasks.map((task, index) => ({
				id: task.id,
				order:
					index === dragIndex
						? hoverIndex
						: index === hoverIndex
							? dragIndex
							: index
			}));

			updateTaskOrders(updates);
		},
		[tasks, updateTaskOrders]
	);

	const backlogTasks = tasks
		?.filter((task) => task.status === TaskStatusEnum.BACKLOG && !task.sprintId)
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	const sprintTaskMap = new Map(
		(sprints ?? []).map((sprint) => {
			const sprintTasks = tasks
				?.filter(
					(task) =>
						task.status === TaskStatusEnum.BACKLOG &&
						task.sprintId === sprint.id
				)
				.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
			return [sprint.id, sprintTasks ?? []] as const;
		})
	);

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl">Backlog</h2>
					<Button onClick={handleCreateTask}>
						<Plus className="h-4 w-4" />
						Add Task
					</Button>
				</div>

				<Accordion type="multiple">
					{(sprints ?? []).map((sprint) => {
						const sprintTasks = sprintTaskMap.get(sprint.id) ?? [];
						const sprintTaskIds = sprintTasks.map((t) => t.id);
						return (
							<AccordionItem key={sprint.id} value={sprint.id}>
								<AccordionTrigger>
									<span className="flex items-center gap-2">
										{sprint.title}
										<span className="text-muted-foreground">
											({sprintTasks.length})
										</span>
									</span>
								</AccordionTrigger>
								<AccordionContent>
									<Table className="border">
										<TableHeader>
											<TableRow>
												<TableHead className="w-12">Order</TableHead>
												<TableHead>Title</TableHead>
												<TableHead>Priority</TableHead>
												<TableHead>Epic</TableHead>
												<TableHead>Sprint</TableHead>
												<TableHead>Tags</TableHead>
												<TableHead className="w-16">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{(sprintTasks ?? []).map((task, index) => (
												<DraggableTaskRow
													key={task.id}
													task={task}
													index={index}
													projectId={id as string}
													onTaskClick={handleTaskClick}
													moveTask={(drag, hover) =>
														moveTask(drag, hover, sprintTaskIds)
													}
													sprints={sprints}
													epics={
														projectData?.epics?.map((epic) => ({
															id: epic.id,
															title: epic.title
														})) || []
													}
												/>
											))}
										</TableBody>
									</Table>
								</AccordionContent>
							</AccordionItem>
						);
					})}

					<AccordionItem value="__backlog__">
						<AccordionTrigger>
							<span className="flex items-center gap-2">
								Backlog
								<span className="text-muted-foreground">
									({backlogTasks?.length ?? 0})
								</span>
							</span>
						</AccordionTrigger>
						<AccordionContent>
							<Table className="border">
								<TableHeader>
									<TableRow>
										<TableHead className="w-12">Order</TableHead>
										<TableHead>Title</TableHead>
										<TableHead>Priority</TableHead>
										<TableHead>Epic</TableHead>
										<TableHead>Sprint</TableHead>
										<TableHead>Tags</TableHead>
										<TableHead className="w-16">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{backlogTasks?.map((task, index) => (
										<DraggableTaskRow
											key={task.id}
											task={task}
											index={index}
											projectId={id as string}
											onTaskClick={handleTaskClick}
											moveTask={(drag, hover) => moveTask(drag, hover)}
											sprints={sprints}
											epics={
												projectData?.epics?.map((epic) => ({
													id: epic.id,
													title: epic.title
												})) || []
											}
										/>
									))}
								</TableBody>
							</Table>
						</AccordionContent>
					</AccordionItem>
				</Accordion>

				<TaskDialog taskId={selectedTask?.id} projectId={id as string} />
			</div>
		</DndProvider>
	);
}
