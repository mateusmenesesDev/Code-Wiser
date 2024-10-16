import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/select';
import { Tabs, TabsList, TabsTrigger } from '~/common/components/tabs';
import type { ProjectCard } from '../types/Projects.type';
import { ProjectDiscussions } from './ProjectDiscussions';
import { ProjectGallery } from './ProjectGallery';
import { ProjectMilestones } from './ProjectMilestones';
import { ProjectOverview } from './ProjectOverview';
import { ProjectResources } from './ProjectResources';

interface ProjectTabsProps {
	project: ProjectCard;
	activeTab: string;
	setActiveTab: (tab: string) => void;
}

export function ProjectTabs({
	project,
	activeTab,
	setActiveTab
}: ProjectTabsProps) {
	const tabOptions = [
		{ value: 'overview', label: 'Overview' },
		{ value: 'milestones', label: 'Milestones' },
		{ value: 'discussions', label: 'Discussions' },
		{ value: 'resources', label: 'Resources' },
		{ value: 'gallery', label: 'Gallery' }
	];

	return (
		<div className="space-y-4">
			<div className="md:hidden">
				<Select value={activeTab} onValueChange={setActiveTab}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select a tab" />
					</SelectTrigger>
					<SelectContent>
						{tabOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="hidden md:block">
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-5">
						{tabOptions.map((option) => (
							<TabsTrigger key={option.value} value={option.value}>
								{option.label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</div>

			<div className="mt-4">
				{activeTab === 'overview' && <ProjectOverview {...project} />}
				{activeTab === 'milestones' && (
					<ProjectMilestones milestones={project.milestones} />
				)}
				{activeTab === 'discussions' && (
					<ProjectDiscussions discussions={project.discussions} />
				)}
				{activeTab === 'resources' && <ProjectResources />}
				{activeTab === 'gallery' && <ProjectGallery images={project.images} />}
			</div>
		</div>
	);
}
