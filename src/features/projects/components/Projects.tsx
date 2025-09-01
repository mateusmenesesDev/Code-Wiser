'use client';

import { Award, Code2, Search, Users } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '~/common/components/ui/button';
import { Input } from '~/common/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { useUser } from '~/common/hooks/useUser';
import { useProject } from '../hooks/useProject';
import { useProjectFilter } from '../hooks/useProjectFilter';
import type {
	ApprovedProjectsApiOutput,
	UserProjectApiResponse
} from '../types/Projects.type';
import { ProjectCard } from './ProjectCard';
import { ProjectCardSkeleton } from './ProjectCardSkeleton';

type ProjectsProps = {
	initialProjectsData?: ApprovedProjectsApiOutput;
	initialUserProjectsData?: UserProjectApiResponse[];
};

export default function Projects({
	initialProjectsData,
	initialUserProjectsData
}: ProjectsProps) {
	const {
		searchTerm,
		setSearchTerm,
		categoryFilter,
		setCategoryFilter,
		difficultyFilter,
		setDifficultyFilter,
		costFilter,
		setCostFilter
	} = useProjectFilter();

	const { userCredits, userHasMentorship } = useUser();
	const { filteredProjects, isLoading, userProjects } = useProject({
		initialProjectsData,
		initialUserProjectsData
	});

	const clearFilters = () => {
		setSearchTerm('');
		setCategoryFilter('all');
		setDifficultyFilter('all');
		setCostFilter('all');
	};

	const hasActiveFilters =
		searchTerm !== '' ||
		categoryFilter !== 'all' ||
		difficultyFilter !== 'all' ||
		costFilter !== 'all';

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Hero Section */}
			<div className="mb-12 animate-fade-in text-center">
				<h1 className="mb-4 font-bold text-5xl">
					Master Fullstack Development
				</h1>
				<p className="mx-auto mb-8 max-w-3xl text-muted-foreground text-xl">
					Discover hands-on projects designed to elevate your coding skills.
					From beginner-friendly tasks to advanced challenges, find the perfect
					project to accelerate your development journey.
				</p>
				<div className="flex items-center justify-center gap-6 text-muted-foreground text-sm">
					<div className="flex items-center gap-2">
						<Code2 className="h-5 w-5 text-blue-600" />
						<span>50+ Projects</span>
					</div>
					<div className="flex items-center gap-2">
						<Users className="h-5 w-5 text-purple-600" />
						<span>Expert Mentors</span>
					</div>
					<div className="flex items-center gap-2">
						<Award className="h-5 w-5 text-green-600" />
						<span>Real-world Skills</span>
					</div>
				</div>
			</div>

			{/* Search and Filters */}
			<div className="mb-8 animate-slide-up rounded-2xl p-6 shadow-lg">
				<div className="flex flex-col gap-4 lg:flex-row">
					<div className="relative flex-1">
						<Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search projects, technologies, or keywords..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="h-12 pl-10 text-lg"
						/>
					</div>

					<div className="flex gap-3">
						<Select value={categoryFilter} onValueChange={setCategoryFilter}>
							<SelectTrigger className="h-12 w-40">
								<SelectValue placeholder="Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								<SelectItem value="Fullstack">Full Stack</SelectItem>
								<SelectItem value="Backend">Backend</SelectItem>
								<SelectItem value="Frontend">Frontend</SelectItem>
							</SelectContent>
						</Select>

						<Select
							value={difficultyFilter}
							onValueChange={setDifficultyFilter}
						>
							<SelectTrigger className="h-12 w-40">
								<SelectValue placeholder="Difficulty" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Levels</SelectItem>
								<SelectItem value="BEGINNER">Beginner</SelectItem>
								<SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
								<SelectItem value="ADVANCED">Advanced</SelectItem>
							</SelectContent>
						</Select>

						<Select value={costFilter} onValueChange={setCostFilter}>
							<SelectTrigger className="h-12 w-40">
								<SelectValue placeholder="Access" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Access</SelectItem>
								<SelectItem value="Free">Free</SelectItem>
								<SelectItem value="Credits">Credits</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			{/* Results Summary */}
			<div className="mb-6 flex items-center justify-between">
				<div className="text-muted-foreground">
					Showing{' '}
					<span className="font-semibold">{filteredProjects?.length || 0}</span>{' '}
					projects
				</div>
				<div className="flex gap-2">
					{hasActiveFilters && (
						<Button variant="outline" size="sm" onClick={clearFilters}>
							Clear Filters
						</Button>
					)}
				</div>
			</div>

			{/* Projects Grid */}
			{isLoading ? (
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
					{filteredProjects?.length === 0 ? (
						<div className="py-16 text-center">
							<div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gray-100">
								<Search className="h-16 w-16 text-muted-foreground" />
							</div>
							<h2 className="mb-2 font-semibold text-2xl">No projects found</h2>
							<div className="mb-6 text-muted-foreground">
								Try adjusting your search criteria or browse all available
								projects.
							</div>
							<Button onClick={clearFilters}>Browse All Projects</Button>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{filteredProjects?.map((project, index) => (
								<div
									key={project.id}
									className="animate-scale-in"
									style={{ animationDelay: `${index * 0.1}s` }}
								>
									<ProjectCard
										userHasMentorship={userHasMentorship}
										projectTemplate={project}
										userCredits={userCredits}
										projectId={
											userProjects?.find((p) => p.title === project.title)?.id
										}
									/>
								</div>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}
