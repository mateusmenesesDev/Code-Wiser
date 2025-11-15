'use client';

import type { TaskStatusEnum } from '@prisma/client';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import {
	KanbanBoard,
	KanbanCards,
	KanbanHeader,
	type KanbanItemProps,
	KanbanProvider
} from '~/common/components/ui/kanban';
import { api } from '~/trpc/react';
import { columns } from '../constants';
import ProjectHeader from './ProjectHeader';
import { useQueryState } from 'nuqs';
import KanbanCardContent from './KanbanCardContent';
import { TaskDialog } from '~/features/task/components/TaskDialog';
import { useDialog } from '~/common/hooks/useDialog';

const TestPage = () => {
	const { id } = useParams();
	const projectId = id as string;
	const utils = api.useUtils();
	const { dialogState } = useDialog('task');

	const { data: allTasks } = api.kanban.getKanbanData.useQuery({
		projectId
	});
	const { data: members } = api.project.getMembers.useQuery({
		projectId
	});
	const { data: sprints } = api.sprint.getAllByProjectId.useQuery({
		projectId,
		isTemplate: false
	});

	const [assigneeFilter] = useQueryState('assignee', {
		defaultValue: 'all'
	});
	const [priorityFilter] = useQueryState('priority', {
		defaultValue: 'all'
	});
	const [sprintFilter] = useQueryState('sprint', {
		defaultValue: 'all'
	});

	// Client-side filtering
	const tasks = useMemo(() => {
		if (!allTasks) return undefined;

		return allTasks.filter((task) => {
			// Filter by assignee
			if (assigneeFilter && assigneeFilter !== 'all') {
				if (task.assignee?.id !== assigneeFilter) {
					return false;
				}
			}

			// Filter by priority
			if (priorityFilter && priorityFilter !== 'all') {
				if (task.priority !== priorityFilter) {
					return false;
				}
			}

			// Filter by sprint
			if (sprintFilter && sprintFilter !== 'all') {
				if (task.sprint?.id !== sprintFilter) {
					return false;
				}
			}

			return true;
		});
	}, [allTasks, assigneeFilter, priorityFilter, sprintFilter]);

	const updateTaskOrdersMutation = api.task.updateTaskOrders.useMutation({
		onMutate: async ({ updates }) => {
			// Cancel any outgoing refetches
			await utils.kanban.getKanbanData.cancel({ projectId });

			// Snapshot the previous value
			const previousTasks = utils.kanban.getKanbanData.getData({ projectId });

			// Optimistically update to the new value
			if (previousTasks) {
				const tasksById = new Map(previousTasks.map((t) => [t.id, t]));

				// Create optimistic tasks in the order specified by updates
				const optimisticTasks = updates
					.map((update) => {
						const task = tasksById.get(update.id);
						if (!task) return null;
						return {
							...task,
							order: update.order,
							status: update.status as TaskStatusEnum
						};
					})
					.filter((t): t is NonNullable<typeof t> => t !== null);

				// Sort by order to maintain correct order
				optimisticTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

				utils.kanban.getKanbanData.setData({ projectId }, optimisticTasks);
			}

			return { previousTasks };
		},
		onError: (_error, _variables, context) => {
			// Rollback to the previous value on error
			if (context?.previousTasks) {
				utils.kanban.getKanbanData.setData(
					{ projectId },
					context.previousTasks
				);
			}
		}
	});

	const handleDataChange = (data: KanbanItemProps[]) => {
		const updates = data.map((task, index) => ({
			id: task.id,
			order: index,
			status: task.status as TaskStatusEnum
		}));
		updateTaskOrdersMutation.mutate({ updates });
	};

	if (!tasks) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-muted-foreground text-sm">Loading tasks...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-[calc(100vh-8rem)] flex-col">
			<ProjectHeader
				members={members ?? []}
				sprints={sprints ?? []}
				tasks={
					tasks?.map((task) => ({ status: task.status as TaskStatusEnum })) ??
					[]
				}
			/>
			<div className="flex-1 overflow-hidden">
				<KanbanProvider
					columns={columns}
					data={tasks}
					onDataChange={handleDataChange}
				>
					{(column) => {
						const columnTasks = tasks.filter((t) => t.status === column.id);
						return (
							<KanbanBoard
								id={column.id}
								key={column.id}
								className={column.bgColor}
							>
								<KanbanHeader>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div
												className="h-2 w-2 rounded-full shadow-sm"
												style={{ backgroundColor: column.color }}
											/>
											<span className="font-semibold text-sm">
												{column.name}
											</span>
										</div>
										<span
											className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 font-medium text-xs"
											style={{
												backgroundColor: column.color,
												color: 'white'
											}}
										>
											{columnTasks.length}
										</span>
									</div>
								</KanbanHeader>
								<KanbanCards id={column.id}>
									{(task) => {
										return <KanbanCardContent task={task} />;
									}}
								</KanbanCards>
							</KanbanBoard>
						);
					}}
				</KanbanProvider>
			</div>
			<TaskDialog
				taskId={dialogState.id ?? undefined}
				projectId={projectId}
				projectTemplateId={undefined}
				epics={[]}
				sprints={[]}
				onSubmit={async (data) => {
					console.log('data', data);
				}}
			/>
		</div>
	);
};

export default TestPage;
