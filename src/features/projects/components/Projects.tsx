'use client';

import { Protect } from '@clerk/nextjs';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '~/common/components/button';
import { api } from '~/trpc/react';
import { ProjectCard } from './ProjectCard';
import { ProjectCardSkeleton } from './ProjectCardSkeleton';
import { ProjectFilters } from './ProjectFilters';

export default function ProjectsPage() {
	const router = useRouter();

	const [searchTerm, setSearchTerm] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('All');
	const [difficultyFilter, setDifficultyFilter] = useState('All');
	const [costFilter, setCostFilter] = useState('All');

	const projectsQuery = api.project.getAll.useQuery({ approved: true });
	const userProjectsQuery = api.project.getEnrolled.useQuery();

	const { data: userProjects, isLoading: projectsLoading } = userProjectsQuery;
	const { data: projects } = projectsQuery;

	const filteredProjects = projects?.filter(
		(project) =>
			project.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
			(categoryFilter === 'All' || project.category.name === categoryFilter) &&
			(difficultyFilter === 'All' || project.difficulty === difficultyFilter) &&
			(costFilter === 'All' ||
				(costFilter === 'Free'
					? project.credits === 0
					: project.credits != null && project.credits > 0))
	);

	const { data: userCredits } = api.user.getCredits.useQuery();

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
					<Button
						className="w-full sm:w-auto"
						onClick={() => router.push('/projects/new')}
					>
						<PlusCircle className="mr-2 h-4 w-4" /> New Project
					</Button>
				</Protect>
			</div>

			{projectsLoading ? (
				<div
					className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
					aria-live="polite"
					aria-busy="true"
				>
					{Array.from({ length: 6 }, () => (
						<ProjectCardSkeleton key={uuidv4()} />
					))}
				</div>
			) : (
				<>
					{!filteredProjects || filteredProjects.length === 0 ? (
						<div className="flex items-center justify-center">
							<p className="text-muted-foreground">No projects found</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
							{filteredProjects.map((project) => (
								<ProjectCard
									status={
										userProjects?.find((up) => up.projectId === project.id)
											?.status
									}
									key={project.id}
									project={project}
									userCredits={userCredits?.credits ?? 0}
								/>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}
