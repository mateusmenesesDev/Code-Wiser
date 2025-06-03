'use client';

import { Protect } from '@clerk/nextjs';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '~/common/components/ui/button';
import { api } from '~/trpc/react';
import { useProject } from '../hooks/useProject';
import { ProjectCard } from './ProjectCard';
import { ProjectCardSkeleton } from './ProjectCardSkeleton';
import { ProjectFilters } from './ProjectFilters';

type ProjectsProps = {
	approvalPage?: boolean;
};

export default function Projects({ approvalPage = false }: ProjectsProps) {
	const router = useRouter();

	const { filteredProjects, userCredits, isLoading } = useProject();

	const myProjects = api.project.getEnrolled.useQuery();

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<ProjectFilters />
				<Protect permission="org:project:create">
					<Button
						className="w-full sm:w-auto"
						onClick={() => router.push('/projects/templates/new')}
					>
						<PlusCircle className="mr-2 h-4 w-4" /> New Project
					</Button>
				</Protect>
			</div>

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
					{!filteredProjects || filteredProjects.length === 0 ? (
						<div className="flex items-center justify-center">
							<p className="text-muted-foreground">No projects found</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
							{filteredProjects.map((project) => (
								<ProjectCard
									status={project.status}
									key={project.id}
									projectTemplate={project}
									userCredits={userCredits}
									approvalPage={approvalPage}
									isEnrolled={myProjects.data?.some(
										(p) => p.title === project.title
									)}
								/>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}
