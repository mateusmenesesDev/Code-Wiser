'use client';

import {
	Calendar,
	Layers,
	LayoutDashboard,
	ListTodo,
	Plus,
	Search,
	Settings
} from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Button } from '~/common/components/button';
import { Input } from '~/common/components/input';
import { Tabs, TabsList, TabsTrigger } from '~/common/components/tabs';
import { mockProject } from '~/features/projects/mocks/projectData';

export default function ProjectEditLayout({
	children
}: {
	children: React.ReactNode;
}) {
	const params = useParams();
	const router = useRouter();
	const pathname = usePathname();
	const project = mockProject;

	const getCurrentTab = () => {
		const tab = pathname.split('/').pop();
		return tab || 'board';
	};

	const handleTabChange = (value: string) => {
		router.push(`/projects/templates/${params.slug}/edit/${value}`);
	};

	return (
		<div className="flex h-screen flex-col">
			<div className="flex-1">
				<Tabs
					value={getCurrentTab()}
					onValueChange={handleTabChange}
					className="h-full"
				>
					<div className="border-b bg-background">
						<div className="flex h-16 items-center justify-between">
							<div className="flex flex-1 items-center">
								<h1 className="mr-6 font-semibold text-2xl">{project.title}</h1>
								<TabsList className="h-10 justify-start rounded-none border-none p-0">
									<TabsTrigger
										value="backlog"
										className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pt-2 pb-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
									>
										<ListTodo className="mr-2 h-4 w-4" />
										Backlog
									</TabsTrigger>
									<TabsTrigger
										value="board"
										className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pt-2 pb-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
									>
										<LayoutDashboard className="mr-2 h-4 w-4" />
										Board
									</TabsTrigger>
									{project.methodology === 'scrum' && (
										<>
											<TabsTrigger
												value="sprints"
												className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pt-2 pb-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
											>
												<Calendar className="mr-2 h-4 w-4" />
												Sprints
											</TabsTrigger>
											<TabsTrigger
												value="epics"
												className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pt-2 pb-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
											>
												<Layers className="mr-2 h-4 w-4" />
												Epics
											</TabsTrigger>
										</>
									)}
									<TabsTrigger
										value="settings"
										className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pt-2 pb-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
									>
										<Settings className="mr-2 h-4 w-4" />
										Settings
									</TabsTrigger>
								</TabsList>
							</div>
							<div className="flex items-center space-x-4">
								<div className="relative">
									<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Search tasks..."
										className="w-[200px] pl-9"
									/>
								</div>
								<Button>
									<Plus className="mr-2 h-4 w-4" />
									Add Task
								</Button>
							</div>
						</div>
					</div>
					<div className="flex-1 overflow-auto">{children}</div>
				</Tabs>
			</div>
		</div>
	);
}