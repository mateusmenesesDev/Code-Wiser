'use client';

import { Protect } from '@clerk/nextjs';
import { AlertTriangle, Calendar, Clock, Play, Users } from 'lucide-react';
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
import { Checkbox } from '~/common/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import { Progress } from '~/common/components/ui/progress';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';
import { Textarea } from '~/common/components/ui/textarea';
import { toast } from 'sonner';
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
	const [statusFilter, setStatusFilter] = useState<
		'active' | 'canceled' | 'all'
	>('active');
	const [projectPendingCancellationId, setProjectPendingCancellationId] =
		useState<string | null>(null);
	const [refundCanceledProjectCredits, setRefundCanceledProjectCredits] =
		useState(true);
	const [cancellationReason, setCancellationReason] = useState('');
	const [cancellationConfirmed, setCancellationConfirmed] = useState(false);
	const utils = api.useUtils();

	const {
		data: projectsData,
		isLoading,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage
	} = api.project.getActiveProjects.useInfiniteQuery(
		{
			limit: 12,
			status: statusFilter
		},
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor
		}
	);

	const projects = projectsData?.pages.flatMap((page) => page.projects) ?? [];
	const projectPendingCancellation =
		projects.find((project) => project.id === projectPendingCancellationId) ??
		null;

	const cancelProject = api.project.cancelProject.useMutation({
		onSuccess: async (result) => {
			setProjectPendingCancellationId(null);
			setRefundCanceledProjectCredits(true);
			setCancellationReason('');
			setCancellationConfirmed(false);
			await utils.project.getActiveProjects.invalidate();
			toast.success(
				result.refundedCredits
					? `Project canceled. ${result.refundedCredits} credits refunded.`
					: 'Project canceled'
			);
		},
		onError: (error) => {
			toast.error(error.message ?? 'Failed to cancel project');
		}
	});

	const openCancellationDialog = (projectId: string) => {
		setProjectPendingCancellationId(projectId);
		setRefundCanceledProjectCredits(true);
		setCancellationReason('');
		setCancellationConfirmed(false);
	};

	const closeCancellationDialog = () => {
		if (cancelProject.isPending) {
			return;
		}
		setProjectPendingCancellationId(null);
		setRefundCanceledProjectCredits(true);
		setCancellationReason('');
		setCancellationConfirmed(false);
	};

	const confirmCancelProject = () => {
		if (!projectPendingCancellation || !cancellationReason.trim()) {
			return;
		}

		cancelProject.mutate({
			projectId: projectPendingCancellation.id,
			refundCredits: refundCanceledProjectCredits,
			reason: cancellationReason.trim()
		});
	};

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

	const projectCountLabel =
		statusFilter === 'active'
			? 'Active Projects'
			: statusFilter === 'canceled'
				? 'Canceled Projects'
				: 'Projects';

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
							{projects.length} {projectCountLabel}
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
					<Select
						value={statusFilter}
						onValueChange={(value) =>
							setStatusFilter(value as typeof statusFilter)
						}
					>
						<SelectTrigger className="w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="canceled">Canceled</SelectItem>
							<SelectItem value="all">All</SelectItem>
						</SelectContent>
					</Select>
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
								: statusFilter === 'canceled'
									? 'No canceled projects.'
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
													<Badge
														variant={
															project.canceledAt
																? 'destructive'
																: status.variant
														}
													>
														{project.canceledAt ? 'Canceled' : status.text}
													</Badge>
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
													<div className="flex justify-end gap-2">
														<Button asChild size="sm">
															<Link href={`/workspace/${project.id}`}>
																<Play className="mr-2 h-4 w-4" />
																View Workspace
															</Link>
														</Button>
														{!project.canceledAt && (
															<Button
																type="button"
																size="sm"
																variant="destructive"
																onClick={() =>
																	openCancellationDialog(project.id)
																}
															>
																Cancel
															</Button>
														)}
													</div>
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

			<Dialog
				open={projectPendingCancellation !== null}
				onOpenChange={(open) => {
					if (!open) {
						closeCancellationDialog();
					}
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-destructive" />
							Cancel project?
						</DialogTitle>
						<DialogDescription>
							This is one-way. Current members keep history access, pending
							invitations are canceled, and normal workspace actions are
							blocked.
						</DialogDescription>
					</DialogHeader>

					{projectPendingCancellation && (
						<div className="space-y-4 py-2 text-sm">
							<div className="rounded-md bg-muted/50 p-3">
								<p className="font-medium">
									{projectPendingCancellation.title}
								</p>
								<p className="text-muted-foreground text-xs">
									{projectPendingCancellation.members.length} current member
									{projectPendingCancellation.members.length === 1 ? '' : 's'}{' '}
									will be notified.
								</p>
							</div>

							<div className="flex items-start gap-2 rounded-md border p-3">
								<Checkbox
									id="cancel-project-refund"
									checked={refundCanceledProjectCredits}
									onCheckedChange={(checked) =>
										setRefundCanceledProjectCredits(checked === true)
									}
									disabled={cancelProject.isPending}
								/>
								<div className="space-y-1">
									<Label htmlFor="cancel-project-refund">
										Refund eligible in-app credits
									</Label>
									<p className="text-muted-foreground text-xs">
										On by default. Refunds unrefunded positive credit evidence
										for current members only.
									</p>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="cancel-project-reason">Reason</Label>
								<Textarea
									id="cancel-project-reason"
									value={cancellationReason}
									onChange={(event) =>
										setCancellationReason(event.target.value)
									}
									placeholder="Visible to current members and pending invitees"
									rows={3}
									maxLength={500}
									className="resize-none"
									disabled={cancelProject.isPending}
								/>
							</div>

							<div className="flex items-start gap-2 rounded-md border border-destructive/30 p-3">
								<Checkbox
									id="cancel-project-confirm"
									checked={cancellationConfirmed}
									onCheckedChange={(checked) =>
										setCancellationConfirmed(checked === true)
									}
									disabled={cancelProject.isPending}
								/>
								<Label
									htmlFor="cancel-project-confirm"
									className="leading-relaxed"
								>
									I understand this cancellation cannot be undone.
								</Label>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={closeCancellationDialog}
							disabled={cancelProject.isPending}
						>
							Keep project
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={confirmCancelProject}
							disabled={
								cancelProject.isPending ||
								!cancellationReason.trim() ||
								!cancellationConfirmed
							}
						>
							{cancelProject.isPending ? 'Canceling…' : 'Cancel project'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
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
