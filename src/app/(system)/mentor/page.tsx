'use client';

import { Protect } from '@clerk/nextjs';
import { Calendar, Clock, MessageSquare, Play, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from '~/common/components/ui/avatar';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Input } from '~/common/components/ui/input';
import { Progress } from '~/common/components/ui/progress';
import { api } from '~/trpc/react';

function StudentAvatar({
	userId,
	name,
	email
}: { userId: string; name?: string | null; email: string }) {
	const { data: imageUrl } = api.user.getAvatar.useQuery(
		{ userId },
		{ enabled: !!userId }
	);
	const fallback = (name || email || '?').slice(0, 1).toUpperCase();
	return (
		<Avatar className="h-6 w-6">
			<AvatarImage src={imageUrl} alt={name ?? email} />
			<AvatarFallback>{fallback}</AvatarFallback>
		</Avatar>
	);
}

function MentorDashboardContent() {
	const [searchTerm, setSearchTerm] = useState('');

	const {
		data: projectsData,
		isLoading,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage
	} = api.project.getActiveProjects.useInfiniteQuery(
		{
			limit: 12
		},
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor
		}
	);

	const projects = projectsData?.pages.flatMap((page) => page.projects) ?? [];

	const filteredProjects = projects.filter(
		(project) =>
			project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			project.members.some(
				(member) =>
					member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					member.email.toLowerCase().includes(searchTerm.toLowerCase())
			)
	);

	const getProgressForProject = (project: (typeof projects)[0]) => {
		const totalTasks = project.tasks.length;
		const completedTasks = project.tasks.filter(
			(task) => task.status === 'DONE'
		).length;
		return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
	};

	const getStatusBadge = (progress: number) => {
		if (progress === 0)
			return { variant: 'secondary' as const, text: 'Not Started' };
		if (progress < 25)
			return { variant: 'outline' as const, text: 'Early Stage' };
		if (progress < 50)
			return { variant: 'default' as const, text: 'In Progress' };
		if (progress < 80) return { variant: 'default' as const, text: 'Advanced' };
		return { variant: 'default' as const, text: 'Near Completion' };
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h1 className="font-bold text-3xl">Mentor Dashboard</h1>
						<p className="text-muted-foreground">
							Track and support your students' projects
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Users className="h-5 w-5 text-blue-600" />
						<span className="text-muted-foreground text-sm">
							{projects.length} Active Projects
						</span>
					</div>
				</div>

				<div className="flex gap-4">
					<Input
						placeholder="Search projects or students..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="max-w-md"
					/>
				</div>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }, () => (
						<Card key={crypto.randomUUID()} className="animate-pulse">
							<CardHeader>
								<div className="h-4 w-3/4 rounded bg-muted" />
								<div className="h-3 w-1/2 rounded bg-muted" />
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="h-3 rounded bg-muted" />
									<div className="h-3 w-2/3 rounded bg-muted" />
									<div className="h-2 w-1/3 rounded bg-muted" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : filteredProjects.length === 0 ? (
				<Card className="py-16 text-center">
					<CardContent>
						<Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
						<h3 className="mb-2 font-semibold text-lg">No projects found</h3>
						<p className="mb-4 text-muted-foreground text-sm">
							{searchTerm
								? 'Try adjusting your search criteria.'
								: 'No active projects yet.'}
						</p>
					</CardContent>
				</Card>
			) : (
				<>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{filteredProjects.map((project) => {
							const progress = getProgressForProject(project);
							const status = getStatusBadge(progress);
							const student = project.members[0];

							return (
								<Card
									key={project.id}
									className="transition-shadow hover:shadow-lg"
								>
									<CardHeader>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<CardTitle className="mb-2 text-lg">
													{project.title}
												</CardTitle>
												<CardDescription className="line-clamp-2">
													{project.description}
												</CardDescription>
											</div>
											<Badge variant={status.variant}>{status.text}</Badge>
										</div>
									</CardHeader>

									<CardContent className="space-y-4">
										{student && (
											<div className="flex items-center gap-2 text-muted-foreground text-sm">
												<StudentAvatar
													userId={student.id}
													name={student.name}
													email={student.email}
												/>
												<span>{student.name || student.email}</span>
											</div>
										)}

										<div>
											<div className="mb-2 flex items-center justify-between text-sm">
												<span className="text-muted-foreground">Progress</span>
												<span>{progress}%</span>
											</div>
											<Progress value={progress} className="h-2" />
										</div>

										<div className="flex items-center justify-between text-muted-foreground text-sm">
											<div className="flex items-center gap-1">
												<Calendar className="h-3 w-3" />
												<span>
													Started{' '}
													{new Date(project.createdAt).toLocaleDateString()}
												</span>
											</div>
											<div className="flex items-center gap-1">
												<Clock className="h-3 w-3" />
												<span>
													Updated{' '}
													{new Date(project.updatedAt).toLocaleDateString()}
												</span>
											</div>
										</div>

										<div className="flex items-center gap-2">
											<Badge variant="outline">
												{project.category?.name || 'General'}
											</Badge>
											<Badge variant="outline">{project.difficulty}</Badge>
										</div>

										<div className="flex gap-2">
											<Button asChild className="flex-1">
												<Link href={`/workspace/${project.id}`}>
													<Play className="mr-2 h-4 w-4" />
													View Workspace
												</Link>
											</Button>
											<Button variant="outline" size="icon" disabled>
												<MessageSquare className="h-4 w-4" />
											</Button>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>

					{hasNextPage && (
						<div className="mt-8 text-center">
							<Button
								onClick={() => fetchNextPage()}
								disabled={isFetchingNextPage}
								variant="outline"
							>
								{isFetchingNextPage ? 'Loading...' : 'Load More Projects'}
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}

export default function MentorDashboardPage() {
	return (
		// biome-ignore lint/a11y/useValidAriaRole: <explanation>
		<Protect role="org:admin">
			<MentorDashboardContent />
		</Protect>
	);
}
