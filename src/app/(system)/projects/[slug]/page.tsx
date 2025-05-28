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
import { useRouter } from 'next/navigation';
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
	const projectResponse = api.project.getBySlug.useQuery({
		slug: 'Attios-Landing-Page'
	});
	const project = projectResponse.data;
	const router = useRouter();
	console.log(project);

	const [activeTab, setActiveTab] = useState('board');

	return (
		<div>
			{/* <Header /> */}

			{/* Header Section */}
			<div className="mb-8 flex items-center justify-between">
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
			</div>

			{/* Project Overview Cards */}
			<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				<Card className="border-0 bg-card/50 shadow-lg backdrop-blur-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Overall Progress
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-3">
							<TrendingUp className="h-8 w-8 text-blue-600" />
							<div>
								<p className="font-bold text-2xl">50 / 100</p>
								<Progress value={50} className="mt-1 h-2 w-20" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-0 bg-card/50 shadow-lg backdrop-blur-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Tasks Completed
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-3">
							<CheckCircle className="h-8 w-8 text-green-600" />
							<div>
								<p className="font-bold text-2xl">
									{
										project?.tasks.filter((task) => task.status === 'DONE')
											.length
									}
									/{project?.tasks.length}
								</p>
								<p className="text-muted-foreground text-xs">Total tasks</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-0 bg-card/50 shadow-lg backdrop-blur-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Current Sprint
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-3">
							<Target className="h-8 w-8 text-purple-600" />
							<div>
								<p className="font-semibold text-sm">Sprint 2</p>
								<p className="text-muted-foreground text-xs">50% complete</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-0 bg-card/50 shadow-lg backdrop-blur-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Time Remaining
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-3">
							<Clock className="h-8 w-8 text-orange-600" />
							<div>
								<p className="font-semibold text-sm">4 weeks</p>
								<p className="text-muted-foreground text-xs">Until deadline</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Design Resources Section */}
			<Card className="mb-8 border-0 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg dark:from-purple-900/20 dark:to-pink-900/20">
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
								<span className="text-2xl">🖼️</span>
							</div>
							<div>
								<h3 className="font-semibold text-foreground text-lg">
									Design File
								</h3>
								<p className="text-muted-foreground text-sm">
									Reference the project designs and mockups
								</p>
							</div>
						</div>
						<Button
							asChild
							className="bg-purple-600 text-white hover:bg-purple-700"
						>
							<a href="#blank" target="_blank" rel="noopener noreferrer">
								View on Figma
							</a>
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Main Content */}
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
							<KanbanBoard />
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
							<div className="space-y-6">
								<div className="flex items-center justify-between">
									<h3 className="font-semibold text-lg">Sprint Management</h3>
									<Button size="sm">
										<Plus className="mr-2 h-4 w-4" />
										Create Sprint
									</Button>
								</div>

								<div className="space-y-4">
									{project?.sprints.map((sprint) => (
										<Card key={sprint.id} className="border bg-card/30">
											<CardHeader className="pb-3">
												<div className="flex items-center justify-between">
													<CardTitle className="text-base">
														{sprint.title}
													</CardTitle>
													{/* TODO: Add sprint status badge */}
													{/* <Badge
															variant={
																sprint.status === 'completed'
																	? 'default'
																	: sprint.status === 'active'
																		? 'secondary'
																		: 'outline'
															}
															className={
																sprint.status === 'completed'
																	? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
																	: sprint.status === 'active'
																		? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
																		: 'bg-muted text-muted-foreground'
															}
														>
															{sprint.status}
														</Badge> */}
												</div>
											</CardHeader>
											<CardContent>
												<div className="space-y-3">
													<div className="flex items-center justify-between text-sm">
														<span className="text-muted-foreground">
															Progress
														</span>
														<span className="font-medium">50%</span>
													</div>
													<Progress value={50} className="h-2" />
													<div className="flex items-center justify-between text-muted-foreground text-sm">
														<span>Tasks: 1/10</span>
														{/* TODO: Add sprint status badge */}
														{/* {sprint.status === 'active' && (
																<Button variant="ghost" size="sm">
																	View Sprint
																</Button>
															)} */}
													</div>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* <CreateSprintDialog
				open={showCreateSprint}
				onOpenChange={setShowCreateSprint}
				onCreateSprint={handleCreateSprint}
			/>

			<CreateTaskDialog
				open={showCreateTask}
				onOpenChange={setShowCreateTask}
				onCreateTask={handleCreateTask}
				epics={epics}
				sprints={sprints}
			/> */}
		</div>
	);
}
