'use client';

import { Protect, useAuth } from '@clerk/nextjs';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/common/components/button';
import { ProjectCard } from './components/ProjectCard';
import { ProjectFilters } from './components/ProjectFilters';
import { projects } from './mocks/projectsData';

export default function ProjectsPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('All');
	const [difficultyFilter, setDifficultyFilter] = useState('All');
	const [costFilter, setCostFilter] = useState('All');
	const { orgId, orgSlug } = useAuth();
	console.log(orgId, orgSlug);
	const filteredProjects = projects.filter(
		(project) =>
			project.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
			(categoryFilter === 'All' || project.category === categoryFilter) &&
			(difficultyFilter === 'All' || project.difficulty === difficultyFilter) &&
			(costFilter === 'All' ||
				(costFilter === 'Free' ? project.credits === 0 : project.credits > 0))
	);

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<ProjectFilters
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
					categoryFilter={categoryFilter}
					setCategoryFilter={setCategoryFilter}
					difficultyFilter={difficultyFilter}
					setDifficultyFilter={setDifficultyFilter}
					costFilter={costFilter}
					setCostFilter={setCostFilter}
				/>
				<Protect permission="org:project:create">
					<Button className="w-full sm:w-auto">
						<PlusCircle className="mr-2 h-4 w-4" /> New Project
					</Button>
				</Protect>
			</div>

			{filteredProjects.length === 0 && (
				<div className="flex items-center justify-center">
					<p className="text-muted-foreground">No projects found</p>
				</div>
			)}

			{filteredProjects.length > 0 && (
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
					{filteredProjects.map((project) => (
						<ProjectCard key={project.id} project={project} />
					))}
				</div>
			)}
		</div>
	);
}
