'use client';

import type { TaskStatusEnum } from '@prisma/client';
import { useParams } from 'next/navigation';
import {
	KanbanBoard,
	KanbanCards,
	KanbanHeader,
	type KanbanItemProps,
	KanbanProvider
} from '~/common/components/ui/kanban';
import { columns } from '../constants';
import ProjectHeader from './ProjectHeader';
import KanbanCardContent from './KanbanCardContent';
import { TaskDialog } from '~/features/task/components/TaskDialog';
import { useDialog } from '~/common/hooks/useDialog';
import { useKanbanFilters } from '../useKanbanFilters';
import { useKanbanData } from '../useKanbanData';
import { useKanbanMutations } from '../useKanbanMutations';

const TestPage = () => {
	const { id } = useParams();
	const projectId = id as string;
	const { dialogState } = useDialog('task');
	const { allTasks, members, sprints } = useKanbanData(projectId);
	const { filterTasks } = useKanbanFilters();
	const { updateTaskOrdersMutation } = useKanbanMutations(projectId);

	const tasks = filterTasks(allTasks ?? []);

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
				stats={
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
								className="bg-card/30"
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
				onSubmit={async (data) => {
					console.log('data', data);
				}}
			/>
		</div>
	);
};

export default TestPage;
