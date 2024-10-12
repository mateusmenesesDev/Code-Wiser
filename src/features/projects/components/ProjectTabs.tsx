import { useState } from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/select';
import { Tabs, TabsList, TabsTrigger } from '~/common/components/tabs';
import type { Project } from '../types/Projects.type';
import { ProjectDiscussions } from './ProjectDiscussions';
import { ProjectGallery } from './ProjectGallery';
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
	const [isMobile, setIsMobile] = useState(false);

	// Check if the screen is mobile on component mount and window resize
	useState(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	const tabOptions = [
		{ value: 'overview', label: 'Overview' },
		{ value: 'milestones', label: 'Milestones' },
		{ value: 'discussions', label: 'Discussions' },
		{ value: 'resources', label: 'Resources' },
		{ value: 'gallery', label: 'Gallery' }
	];

	return (
		<div className="space-y-4">
			{isMobile ? (
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
			) : (
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-5">
						{tabOptions.map((option) => (
							<TabsTrigger key={option.value} value={option.value}>
								{option.label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			)}

			<div className="mt-4">
				{activeTab === 'overview' && (
					<ProjectOverview project={project.details} />
				)}
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
