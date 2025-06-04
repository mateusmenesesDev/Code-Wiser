'use client';

import { FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent } from '~/common/components/ui/card';
import { MyProjectCard } from '~/features/projects/components/MyProjectCard';
import { MyProjectCardSkeleton } from '~/features/projects/components/MyProjectCardSkeleton';
import { useMyProjects } from '~/features/projects/hooks/useMyProjects';

export default function MyProjectsPage() {
	const { projects, isLoading } = useMyProjects();

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="mb-2 font-bold text-3xl text-foreground">
						My Projects
					</h1>
					<p className="text-muted-foreground">
						Track your progress and continue learning
					</p>
				</div>
				<Button asChild>
					<Link href="/">
						<FolderOpen className="mr-2 h-4 w-4" />
						Browse Projects
					</Link>
				</Button>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }, () => (
						<MyProjectCardSkeleton key={crypto.randomUUID()} />
					))}
				</div>
			) : projects.length === 0 ? (
				<Card className="py-16 text-center">
					<CardContent>
						<FolderOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
						<h3 className="mb-2 font-semibold text-lg">
							No projects started yet
						</h3>
						<p className="mb-4 text-muted-foreground text-sm">
							Start your first project to begin your development journey
						</p>
						<Button asChild>
							<Link href="/">Browse Available Projects</Link>
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{projects.map((project) => (
						<MyProjectCard key={project.id} project={project} />
					))}
				</div>
			)}
		</div>
	);
}
