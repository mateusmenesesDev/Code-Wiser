'use client';

import { ProjectMethodologyEnum, type TaskStatusEnum } from '@prisma/client';
import { useParams } from 'next/navigation';
import { parseAsString, useQueryState, useQueryStates } from 'nuqs';
import { Suspense, useEffect, useState } from 'react';
import {
	KanbanBoard,
	KanbanCards,
	KanbanHeader,
	type KanbanItemProps,
	KanbanProvider
} from '~/common/components/ui/kanban';
import Backlog from '~/features/backlog/components/Backlog';
import KanbanCardContent from '~/features/kanban/components/KanbanCardContent';
import { columns } from '~/features/kanban/constants';
import { useKanbanData } from '~/features/kanban/hooks/useKanbanData';
import { useKanbanFilters } from '~/features/kanban/hooks/useKanbanFilters';
import { useKanbanMutations } from '~/features/kanban/hooks/useKanbanMutations';
import SprintBoard from '~/features/sprints/components/SprintBoard';
import SprintSidebar from '~/features/sprints/components/SprintSidebar';
import { TaskDialog } from '~/features/task/components/TaskDialog';
import ProjectHeader from '~/features/workspace/components/ProjectHeader';
import { ProjectSettingsModal } from '~/features/workspace/components/ProjectSettingsModal';
import { api } from '~/trpc/react';

const Workspace = () => {
	const { id } = useParams();
	const projectId = id as string;
	const [taskId, setTaskId] = useQueryState('taskId', parseAsString);
	const [{ view, sprintId }, setViewParams] = useQueryStates({
		view: parseAsString,
		sprintId: parseAsString
	});

	const { allTasks, members, sprints } = useKanbanData(projectId);
	const { data: projectInfo } = api.project.getWorkspaceInfo.useQuery({
		id: projectId
	});
	const { filterTasks } = useKanbanFilters();
	const { updateTaskOrdersMutation } = useKanbanMutations(projectId);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	const tasks = filterTasks(allTasks ?? []);
	const isScrum = projectInfo?.methodology === ProjectMethodologyEnum.SCRUM;

	useEffect(() => {
		if (!isScrum) {
			setViewParams({ view: null, sprintId: null });
		}
	}, [isScrum, setViewParams]);

	const selectedSprint =
		view === 'sprint' && sprintId
			? (sprints ?? []).find((s) => s.id === sprintId) ?? null
			: null;

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
			{view !== 'backlog' && (
				<ProjectHeader
					projectId={projectId}
					members={members ?? []}
					sprints={sprints ?? []}
					stats={
						tasks?.map((task) => ({
							status: task.status as TaskStatusEnum
						})) ?? []
					}
					projectTitle={projectInfo?.title ?? ''}
					projectFigmaUrl={projectInfo?.figmaProjectUrl ?? ''}
					methodology={projectInfo?.methodology ?? ProjectMethodologyEnum.SCRUM}
					onCreateTask={() => setTaskId('new')}
					onOpenSettings={() => setIsSettingsOpen(true)}
				/>
			)}
			<div className="flex flex-1 overflow-hidden">
				{isScrum && (
					<SprintSidebar
						projectId={projectId}
						sprints={sprints ?? []}
						selectedSprintId={sprintId}
						currentView={view}
						onSelectBoard={() => setViewParams({ view: null, sprintId: null })}
						onSelectSprint={(id) =>
							setViewParams({ view: 'sprint', sprintId: id })
						}
						onSelectBacklog={() =>
							setViewParams({ view: 'backlog', sprintId: null })
						}
					/>
				)}
				<div className="flex-1 overflow-hidden">
					{isScrum && view === 'sprint' && selectedSprint ? (
						<SprintBoard
							sprint={selectedSprint}
							projectId={projectId}
						/>
					) : isScrum && view === 'backlog' ? (
						<Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading backlog...</div>}>
							<div className="h-full overflow-y-auto p-6">
								<Backlog projectId={projectId} />
							</div>
						</Suspense>
					) : (
						<KanbanProvider
							columns={columns}
							data={tasks}
							onDataChange={handleDataChange}
						>
							{(column) => {
								const columnTasks = tasks.filter(
									(t) => t.status === column.id
								);
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
					)}
				</div>
			</div>
		{view !== 'backlog' && (
			<TaskDialog
				taskId={taskId ?? undefined}
				projectId={projectId}
				onClose={() => setTaskId(null)}
			/>
		)}
		<ProjectSettingsModal
			projectId={projectId}
			open={isSettingsOpen}
			onOpenChange={setIsSettingsOpen}
		/>
	</div>
);
};

export default Workspace;
