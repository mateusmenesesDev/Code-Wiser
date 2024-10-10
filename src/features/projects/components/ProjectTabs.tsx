import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from '~/common/components/tabs';
import type { Project } from '../types/Projects.type';
import { ProjectDiscussions } from './ProjectDiscussions';
import { ProjectMilestones } from './ProjectMilestones';
import { ProjectOverview } from './ProjectOverview';
import { ProjectResources } from './ProjectResources';

interface ProjectTabsProps {
	project: Project;
	activeTab: string;
	setActiveTab: (tab: string) => void;
}

export function ProjectTabs({
	project,
	activeTab,
	setActiveTab
}: ProjectTabsProps) {
	return (
		<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
			<TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
				<TabsTrigger value="overview">Overview</TabsTrigger>
				<TabsTrigger value="milestones">Milestones</TabsTrigger>
				<TabsTrigger value="discussions">Discussions</TabsTrigger>
				<TabsTrigger value="resources">Resources</TabsTrigger>
			</TabsList>
			<TabsContent value="overview">
				<ProjectOverview project={project.details} />
			</TabsContent>
			<TabsContent value="milestones">
				<ProjectMilestones milestones={project.milestones} />
			</TabsContent>
			<TabsContent value="discussions">
				<ProjectDiscussions discussions={project.discussions} />
			</TabsContent>
			<TabsContent value="resources">
				<ProjectResources />
			</TabsContent>
		</Tabs>
	);
}
