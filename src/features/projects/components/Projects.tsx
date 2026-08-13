'use client';

import { ProjectMethodologyEnum } from '@prisma/client';
import { Award, Code2, Search, Users } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '~/common/components/ui/button';
import { Checkbox } from '~/common/components/ui/checkbox';
import { Input } from '~/common/components/ui/input';
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/common/components/ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { useUser } from '~/common/hooks/useUser';
import { OnboardingTour } from '~/features/onboarding/OnboardingTour';
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
		setCostFilter,
		technologiesFilter,
		setTechnologiesFilter,
		methodologyFilter,
		setMethodologyFilter,
		sortFilter,
		setSortFilter
	} = useProjectFilter();

	const { userCredits, userHasMentorship, isUserMentorshipLoading } = useUser();
	const {
		filteredProjects,
		filterOptions,
		isError,
		isLoading,
		retry,
		userProjects
	} = useProject({
		initialProjectsData,
		initialUserProjectsData
	});

	const clearFilters = () => {
		setSearchTerm('');
		setCategoryFilter('all');
		setDifficultyFilter('all');
		setCostFilter('all');
		setTechnologiesFilter([]);
		setMethodologyFilter('all');
		setSortFilter('relevance');
	};

	const hasActiveFilters =
		searchTerm !== '' ||
		categoryFilter !== 'all' ||
		difficultyFilter !== 'all' ||
		costFilter !== 'all' ||
		technologiesFilter.length > 0 ||
		methodologyFilter !== 'all' ||
		sortFilter !== 'relevance';

	return (
		<div
			className="container mx-auto px-4 py-8"
			data-onboarding="project-catalog"
		>
			<div className="mb-4 flex justify-end">
				<OnboardingTour flow="normal" />
			</div>

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
						<Code2 className="h-5 w-5 text-info" />
						<span>50+ Projects</span>
					</div>
					<div className="flex items-center gap-2">
						<Users className="h-5 w-5 text-purple-600" />
						<span>Expert Mentors</span>
					</div>
					<div className="flex items-center gap-2">
						<Award className="h-5 w-5 text-success" />
						<span>Real-world Skills</span>
					</div>
				</div>
			</div>

			{/* Search and Filters */}
			<div className="mb-8 animate-slide-up rounded-2xl p-6 shadow-lg">
				<div className="flex flex-col gap-4">
					<div className="relative">
						<Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							maxLength={100}
							placeholder="Search projects by title or description..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="h-12 pl-10 text-lg"
						/>
					</div>

					<div className="flex flex-wrap gap-3">
						<Select value={categoryFilter} onValueChange={setCategoryFilter}>
							<SelectTrigger className="h-10 w-40">
								<SelectValue placeholder="Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								{filterOptions?.categories.map((category) => (
									<SelectItem key={category} value={category}>
										{category}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" className="h-10 w-44 justify-between">
									{technologiesFilter.length > 0
										? `${technologiesFilter.length} technologies`
										: 'Technologies'}
								</Button>
							</PopoverTrigger>
							<PopoverContent
								align="start"
								className="max-h-72 overflow-y-auto"
							>
								<div className="space-y-3">
									<p className="font-medium text-sm">Match any technology</p>
									{filterOptions?.technologies.map((technology) => (
										<label
											key={technology}
											htmlFor={`technology-${technology}`}
											className="flex cursor-pointer items-center gap-2 text-sm"
										>
											<Checkbox
												id={`technology-${technology}`}
												checked={technologiesFilter.includes(technology)}
												onCheckedChange={(checked) =>
													setTechnologiesFilter(
														checked
															? [...technologiesFilter, technology]
															: technologiesFilter.filter(
																	(item) => item !== technology
																)
													)
												}
											/>
											<span>{technology}</span>
										</label>
									))}
								</div>
							</PopoverContent>
						</Popover>

						<Select
							value={difficultyFilter}
							onValueChange={setDifficultyFilter}
						>
							<SelectTrigger className="h-10 w-40">
								<SelectValue placeholder="Difficulty" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Levels</SelectItem>
								<SelectItem value="BEGINNER">Beginner</SelectItem>
								<SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
								<SelectItem value="ADVANCED">Advanced</SelectItem>
							</SelectContent>
						</Select>

						<Select
							value={methodologyFilter}
							onValueChange={setMethodologyFilter}
						>
							<SelectTrigger className="h-10 w-40">
								<SelectValue placeholder="Methodology" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Methodologies</SelectItem>
								<SelectItem value={ProjectMethodologyEnum.SCRUM}>
									Scrum
								</SelectItem>
								<SelectItem value={ProjectMethodologyEnum.KANBAN}>
									Kanban
								</SelectItem>
							</SelectContent>
						</Select>

						<Select value={costFilter} onValueChange={setCostFilter}>
							<SelectTrigger className="h-10 w-40">
								<SelectValue placeholder="Access" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Access</SelectItem>
								<SelectItem value="Free">Free</SelectItem>
								<SelectItem value="Credits">Credits</SelectItem>
								<SelectItem value="Mentorship">Mentorship</SelectItem>
							</SelectContent>
						</Select>

						<Select value={sortFilter} onValueChange={setSortFilter}>
							<SelectTrigger className="h-10 w-40">
								<SelectValue placeholder="Sort" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="relevance">Most relevant</SelectItem>
								<SelectItem value="newest">Newest</SelectItem>
								<SelectItem value="difficulty">Difficulty</SelectItem>
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
			{isError ? (
				<div className="py-16 text-center">
					<h2 className="mb-2 font-semibold text-2xl">
						Projects could not be loaded
					</h2>
					<p className="mb-6 text-muted-foreground">
						Check your connection and try again.
					</p>
					<Button onClick={() => void retry()}>Try Again</Button>
				</div>
			) : isLoading ? (
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
							<div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-muted">
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
										isUserMentorshipLoading={isUserMentorshipLoading}
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
