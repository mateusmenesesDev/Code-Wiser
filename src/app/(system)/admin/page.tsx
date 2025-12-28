'use client';

import { Protect } from '@clerk/nextjs';
import { Calendar, Clock, Play, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from '~/common/components/ui/avatar';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent } from '~/common/components/ui/card';
import { Input } from '~/common/components/ui/input';
import { Progress } from '~/common/components/ui/progress';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';
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
						<Users className="h-5 w-5 text-info" />
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
				<Card>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Project</TableHead>
									<TableHead>Student</TableHead>
									<TableHead>Progress</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Difficulty</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Updated</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{Array.from({ length: 5 }, () => (
									<TableRow key={crypto.randomUUID()}>
										<TableCell>
											<div className="space-y-1">
												<div className="h-4 w-40 animate-pulse rounded bg-muted" />
												<div className="h-3 w-32 animate-pulse rounded bg-muted" />
											</div>
										</TableCell>
										<TableCell>
											<div className="h-4 w-28 animate-pulse rounded bg-muted" />
										</TableCell>
										<TableCell>
											<div className="h-2 w-24 animate-pulse rounded bg-muted" />
										</TableCell>
										<TableCell>
											<div className="h-5 w-20 animate-pulse rounded bg-muted" />
										</TableCell>
										<TableCell>
											<div className="h-5 w-16 animate-pulse rounded bg-muted" />
										</TableCell>
										<TableCell>
											<div className="h-5 w-16 animate-pulse rounded bg-muted" />
										</TableCell>
										<TableCell>
											<div className="h-4 w-20 animate-pulse rounded bg-muted" />
										</TableCell>
										<TableCell>
											<div className="h-4 w-20 animate-pulse rounded bg-muted" />
										</TableCell>
										<TableCell>
											<div className="ml-auto h-8 w-24 animate-pulse rounded bg-muted" />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			) : filteredProjects.length === 0 ? (
				<Card className="py-16 text-center">
					<CardContent>
						<Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
						<h2 className="mb-2 font-semibold text-lg">No projects found</h2>
						<p className="mb-4 text-muted-foreground text-sm">
							{searchTerm
								? 'Try adjusting your search criteria.'
								: 'No active projects yet.'}
						</p>
					</CardContent>
				</Card>
			) : (
				<>
					<Card>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Project</TableHead>
										<TableHead>Student</TableHead>
										<TableHead>Progress</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Category</TableHead>
										<TableHead>Difficulty</TableHead>
										<TableHead>Created</TableHead>
										<TableHead>Updated</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredProjects.map((project) => {
										const progress = getProgressForProject(project);
										const status = getStatusBadge(progress);
										const student = project.members[0];

										return (
											<TableRow key={project.id}>
												<TableCell>
													<div className="space-y-1">
														<div className="font-medium">{project.title}</div>
														<div className="line-clamp-1 text-muted-foreground text-sm">
															{project.description}
														</div>
													</div>
												</TableCell>
												<TableCell>
													{student ? (
														<div className="flex items-center gap-2">
															<StudentAvatar
																userId={student.id}
																name={student.name}
																email={student.email}
															/>
															<span className="text-muted-foreground text-sm">
																{student.name || student.email}
															</span>
														</div>
													) : (
														<span className="text-muted-foreground text-sm">
															N/A
														</span>
													)}
												</TableCell>
												<TableCell>
													<div className="space-y-1">
														<Progress value={progress} className="h-2 w-24" />
														<span className="text-muted-foreground text-sm">
															{progress}%
														</span>
													</div>
												</TableCell>
												<TableCell>
													<Badge variant={status.variant}>{status.text}</Badge>
												</TableCell>
												<TableCell>
													<Badge variant="outline">
														{project.category?.name || 'General'}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge variant="outline">{project.difficulty}</Badge>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1 text-muted-foreground text-sm">
														<Calendar className="h-3 w-3" />
														{new Date(project.createdAt).toLocaleDateString()}
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1 text-muted-foreground text-sm">
														<Clock className="h-3 w-3" />
														{new Date(project.updatedAt).toLocaleDateString()}
													</div>
												</TableCell>
												<TableCell className="text-right">
													<Button asChild size="sm">
														<Link href={`/workspace/${project.id}`}>
															<Play className="mr-2 h-4 w-4" />
															View Workspace
														</Link>
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</CardContent>
					</Card>

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
