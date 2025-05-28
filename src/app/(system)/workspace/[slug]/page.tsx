'use client';

import { Progress } from '@radix-ui/react-progress';
import {
	ArrowLeft,
	CheckCircle,
	Clock,
	MessageSquare,
	Plus,
	Settings,
	Target,
	TrendingUp
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from '~/common/components/ui/tabs';
import { KanbanBoard } from '~/features/projects/components';
import { api } from '~/trpc/react';

export default function ProjectPage() {
	const params = useParams();
	const projectSlug = params.slug as string;

	const projectResponse = api.project.getBySlug.useQuery({
		slug: projectSlug
	});
	const project = projectResponse.data;
	const router = useRouter();

	const [activeTab, setActiveTab] = useState('board');

	return (
		<div>
			{/* Header Section */}
			<section className="mb-8 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" onClick={() => router.back()}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Projects
					</Button>
					<div>
						<h1 className="font-bold text-3xl">{project?.title}</h1>
						<p className="text-muted-foreground">Workspace</p>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<Button variant="outline" size="sm">
						<MessageSquare className="mr-2 h-4 w-4" />
						Ask Mentor
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.push('/project-settings')}
					>
						<Settings className="mr-2 h-4 w-4" />
						Settings
					</Button>
				</div>
			</section>

			{/* Project Overview Cards */}
			<section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total Tasks</CardTitle>
						<Target className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">24</div>
						<p className="text-muted-foreground text-xs">+2 from last week</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Completed</CardTitle>
						<CheckCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">12</div>
						<p className="text-muted-foreground text-xs">50% completion</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">In Progress</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">8</div>
						<p className="text-muted-foreground text-xs">+4 from yesterday</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Progress</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">68%</div>
						<Progress value={68} className="mt-2" />
					</CardContent>
				</Card>
			</section>

			{/* Main Content */}
			<section>
				<Card className="border-0 bg-card/40 shadow-lg backdrop-blur-sm">
					<CardHeader>
						<Tabs
							value={activeTab}
							onValueChange={setActiveTab}
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
								backlog
								{/* <BacklogTable
									tasks={allTasks}
									epics={epics}
									onCreateTask={() => setShowCreateTask(true)}
								/> */}
							</TabsContent>

							<TabsContent value="epics" className="mt-0">
								epics
								{/* <EpicsView epics={epics} tasks={allTasks} /> */}
							</TabsContent>

							<TabsContent value="sprints" className="mt-0">
								sprints
								{/* <SprintsView sprints={sprints} tasks={allTasks} /> */}
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
		</div>
	);
}
