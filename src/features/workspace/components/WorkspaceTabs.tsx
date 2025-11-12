import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '~/common/components/ui/card';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from '~/common/components/ui/tabs';
import EpicList from '~/features/epics/components/EpicList/EpicList';
import SprintList from '~/features/sprints/components/SprintList';
import { KanbanBoard } from '~/features/workspace/components/board/KanbanBoard';
import { KanbanBoardSkeleton } from '~/features/workspace/components/board/KanbanBoardSkeleton';
import Backlog from './backlog/Backlog';
import { BacklogSkeleton } from './backlog/BacklogSkeleton';

interface WorkspaceTabsProps {
	projectId: string;
	activeTab: string;
	onTabChange: (tab: string) => void;
}

export function WorkspaceTabs({
	projectId,
	activeTab,
	onTabChange
}: WorkspaceTabsProps) {
	return (
		<>
			{/* Main Content */}
			<section>
				<Card className="border-0 bg-card/40 shadow-lg backdrop-blur-sm">
					<CardHeader className="p-2 2xl:p-4">
						<Tabs
							value={activeTab}
							onValueChange={onTabChange}
							className="w-full"
						>
							<TabsList className="grid w-full grid-cols-4 bg-muted">
								<TabsTrigger value="board">Kanban Board</TabsTrigger>
								<TabsTrigger value="backlog">Backlog</TabsTrigger>
								<TabsTrigger value="epics">Epics</TabsTrigger>
								<TabsTrigger value="sprints">Sprints</TabsTrigger>
							</TabsList>
						</Tabs>
					</CardHeader>

					<CardContent className="px-4">
						<Tabs value={activeTab}>
							<TabsContent value="board" className="mt-0">
								<Suspense fallback={<KanbanBoardSkeleton />}>
									<KanbanBoard projectId={projectId} />
								</Suspense>
							</TabsContent>

							<TabsContent value="backlog" className="mt-0">
								<Suspense fallback={<BacklogSkeleton />}>
									<Backlog projectId={projectId} />
								</Suspense>
							</TabsContent>

							<TabsContent value="epics" className="mt-0">
								<EpicList projectId={projectId} isTemplate={false} />
							</TabsContent>

							<TabsContent value="sprints" className="mt-0">
								<SprintList projectId={projectId} isTemplate={false} />
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</section>
		</>
	);
}
