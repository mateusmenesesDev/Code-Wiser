'use client';

import { SprintStatusEnum } from '@prisma/client';
import dayjs from 'dayjs';
import { Plus } from 'lucide-react';
import { parseAsString, useQueryState } from 'nuqs';
import { useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from '~/common/components/ui/accordion';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Progress } from '~/common/components/ui/progress';
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import { groupTasksBySprintId } from '~/common/utils/kanbanReorder';
import { useKanbanFilters } from '~/features/kanban/hooks/useKanbanFilters';
import { useSprintQueries } from '~/features/sprints/hooks/useSprintQueries';
import { TaskDialog } from '~/features/task/components/TaskDialog';
import { useTask } from '~/features/task/hooks/useTask';
import type { TasksApiOutput } from '~/features/workspace/types/Task.type';
import { api } from '~/trpc/react';
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
	const [taskId, setTaskId] = useQueryState('taskId', parseAsString);
	const isTemplate = useIsTemplate();

	const { getAllSprints } = useSprintQueries();
	const { updateTaskOrders, getAllTasksByProjectId } = useTask({ projectId });
	const { filterTasks } = useKanbanFilters();

	const [sprints] = getAllSprints();

	const [tasks] = getAllTasksByProjectId(projectId);

	const [epics] = api.epic.getAllByProjectId.useSuspenseQuery({
		projectId,
		isTemplate
	});

	const handleCreateTask = useCallback(() => {
		setTaskId('new');
	}, [setTaskId]);

	const handleTaskClick = useCallback(
		(task: NonNullable<TasksApiOutput>[number]) => {
			setTaskId(task.id);
		},
		[setTaskId]
	);

	const visibleTasks = filterTasks(tasks ?? []);
	const tasksBySprint = groupTasksBySprintId(visibleTasks);

	const moveTask = useCallback(
		(dragIndex: number, hoverIndex: number, groupTaskIds?: string[]) => {
			if (dragIndex === hoverIndex) return;

			const groupIdSet =
				groupTaskIds && groupTaskIds.length > 0 ? new Set(groupTaskIds) : null;
			const firstVisibleTask = groupTaskIds?.[0]
				? (tasks ?? []).find((task) => task.id === groupTaskIds[0])
				: undefined;
			const groupSprintId = firstVisibleTask?.sprintId ?? null;

			const groupTasks = (tasks ?? [])
				.filter((task) => task.sprintId === groupSprintId)
				.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

			const visibleTaskIds = groupIdSet
				? groupTasks
						.filter((task) => groupIdSet.has(task.id))
						.map((task) => task.id)
				: groupTasks.map((task) => task.id);
			if (visibleTaskIds.length === 0) return;

			const reorderedVisibleTaskIds = [...visibleTaskIds];
			const [draggedTaskId] = reorderedVisibleTaskIds.splice(dragIndex, 1);
			if (!draggedTaskId) return;
			reorderedVisibleTaskIds.splice(hoverIndex, 0, draggedTaskId);
			const visibleTaskIdSet = new Set(visibleTaskIds);
			let visibleIndex = 0;
			const updates = groupTasks.map((task, index) => ({
				id: visibleTaskIdSet.has(task.id)
					? (reorderedVisibleTaskIds[visibleIndex++] ?? task.id)
					: task.id,
				order: index
			}));

			updateTaskOrders(updates);
		},
		[tasks, updateTaskOrders]
	);

	const backlogTasks = (tasksBySprint.get(null) ?? []).sort(
		(a, b) => (a.order ?? 0) - (b.order ?? 0)
	);

	const sprintTaskMap = new Map(
		(sprints ?? []).map((sprint) => {
			const sprintTasks = (tasksBySprint.get(sprint.id) ?? []).sort(
				(a, b) => (a.order ?? 0) - (b.order ?? 0)
			);
			return [sprint.id, sprintTasks] as const;
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
									<div className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-2">
										<div className="flex min-w-0 items-center gap-2">
											<span className="truncate">{sprint.title}</span>
											<Badge
												variant={
													sprint.status === SprintStatusEnum.ACTIVE
														? 'success'
														: sprint.status === SprintStatusEnum.COMPLETED
															? 'outline'
															: 'secondary'
												}
												className="shrink-0 text-xs"
											>
												{sprint.status === SprintStatusEnum.ACTIVE
													? 'Active'
													: sprint.status === SprintStatusEnum.COMPLETED
														? 'Completed'
														: 'Planning'}
											</Badge>
										</div>
										<div className="flex shrink-0 items-center gap-3 text-muted-foreground text-xs">
											{sprint.startDate && sprint.endDate && (
												<span>
													{dayjs(sprint.startDate).format('MMM D')} –{' '}
													{dayjs(sprint.endDate).format('MMM D')}
												</span>
											)}
											<div className="flex items-center gap-2">
												<Progress
													value={
														sprint.taskCount > 0
															? (sprint.doneCount / sprint.taskCount) * 100
															: 0
													}
													className="h-1.5 w-16"
												/>
												<span>
													{sprint.doneCount}/{sprint.taskCount} done
												</span>
											</div>
											<span>({sprintTasks.length})</span>
										</div>
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<Table className="border">
										<TableHeader>
											<TableRow>
												<TableHead className="w-24">Task ID</TableHead>
												<TableHead>Title</TableHead>
												<TableHead>Priority</TableHead>
												<TableHead>Status</TableHead>
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
													projectId={projectId}
													isTemplate={isTemplate}
													onTaskClick={handleTaskClick}
													moveTask={(drag, hover) =>
														moveTask(drag, hover, sprintTaskIds)
													}
													sprints={sprints}
													epics={epics.map((epic) => ({
														id: epic.id,
														title: epic.title
													}))}
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
										<TableHead className="w-24">Task ID</TableHead>
										<TableHead>Title</TableHead>
										<TableHead>Priority</TableHead>
										<TableHead>Status</TableHead>
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
											projectId={projectId}
											isTemplate={isTemplate}
											onTaskClick={handleTaskClick}
											moveTask={(drag, hover) =>
												moveTask(
													drag,
													hover,
													backlogTasks.map((task) => task.id)
												)
											}
											sprints={sprints}
											epics={epics.map((epic) => ({
												id: epic.id,
												title: epic.title
											}))}
										/>
									))}
								</TableBody>
							</Table>
						</AccordionContent>
					</AccordionItem>
				</Accordion>

				<TaskDialog
					taskId={taskId ?? undefined}
					projectId={projectId}
					onClose={() => setTaskId(null)}
				/>
			</div>
		</DndProvider>
	);
}
