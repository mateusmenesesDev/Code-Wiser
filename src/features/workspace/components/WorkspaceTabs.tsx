import { Plus } from 'lucide-react';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent, CardHeader } from '~/common/components/ui/card';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from '~/common/components/ui/tabs';
import { KanbanBoard } from '~/features/workspace/components/board/KanbanBoard';

interface WorkspaceTabsProps {
	projectSlug: string;
	activeTab: string;
	onTabChange: (tab: string) => void;
}

export function WorkspaceTabs({
	projectSlug,
	activeTab,
	onTabChange
}: WorkspaceTabsProps) {
	return (
		<>
			{/* Main Content */}
			<section>
				<Card className="border-0 bg-card/40 shadow-lg backdrop-blur-sm">
					<CardHeader>
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

					<CardContent className="p-6">
						<Tabs value={activeTab}>
							<TabsContent value="board" className="mt-0">
								<KanbanBoard projectSlug={projectSlug} />
							</TabsContent>

							<TabsContent value="backlog" className="mt-0">
								<div className="flex h-64 items-center justify-center text-muted-foreground">
									<p>Backlog view coming soon...</p>
								</div>
							</TabsContent>

							<TabsContent value="epics" className="mt-0">
								<div className="flex h-64 items-center justify-center text-muted-foreground">
									<p>Epics view coming soon...</p>
								</div>
							</TabsContent>

							<TabsContent value="sprints" className="mt-0">
								<div className="flex h-64 items-center justify-center text-muted-foreground">
									<p>Sprints view coming soon...</p>
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</section>

			{/* Floating Action Button */}
			<div className="fixed right-6 bottom-6">
				<Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
					<Plus className="h-6 w-6" />
				</Button>
			</div>
		</>
	);
}
