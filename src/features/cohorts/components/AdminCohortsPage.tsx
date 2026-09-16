'use client';

import { UsersRound } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { Textarea } from '~/common/components/ui/textarea';
import { api } from '~/trpc/react';

const toDate = (value: string) => new Date(value);
const cohortEventTypes = [
	'KICKOFF',
	'CHECKPOINT',
	'DELIVERY',
	'CLOSURE',
	'RETROSPECTIVE'
] as const;
type CohortEventType = (typeof cohortEventTypes)[number];

const formatEventDate = (value: Date | string) =>
	new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(new Date(value));

const toDateTimeLocal = (value: Date | string) => {
	const date = new Date(value);
	const pad = (part: number) => String(part).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function AdminCohortsPage() {
	const utils = api.useUtils();
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [startsAt, setStartsAt] = useState('');
	const [endsAt, setEndsAt] = useState('');
	const [selectedCohortId, setSelectedCohortId] = useState('none');
	const [memberId, setMemberId] = useState('none');
	const [reviewerId, setReviewerId] = useState('none');
	const [reviewId, setReviewId] = useState('none');
	const [projectId, setProjectId] = useState('none');
	const [eventType, setEventType] = useState<CohortEventType>('CHECKPOINT');
	const [editingEventId, setEditingEventId] = useState<string | null>(null);
	const [eventTitle, setEventTitle] = useState('');
	const [eventDescription, setEventDescription] = useState('');
	const [eventStartsAt, setEventStartsAt] = useState('');
	const [eventEndsAt, setEventEndsAt] = useState('');

	const cohortsQuery = api.cohort.list.useQuery();
	const usersQuery = api.user.listAll.useQuery({ take: 100 });
	const reviewsQuery = api.cohort.listAssignableReviews.useQuery();
	const projectsQuery = api.cohort.listAssignableProjects.useQuery();
	const suggestionsQuery = api.cohort.listPeerReviewSuggestions.useQuery(
		{
			cohortId: selectedCohortId,
			pullRequestReviewId: reviewId
		},
		{
			enabled:
				selectedCohortId !== 'none' &&
				reviewId !== 'none' &&
				cohortsQuery.data?.some(
					({ id, status }) => id === selectedCohortId && status === 'ACTIVE'
				) === true
		}
	);
	const reportsQuery = api.cohort.listPeerReviewReports.useQuery();

	const refresh = async () => {
		await Promise.all([
			utils.cohort.list.invalidate(),
			utils.cohort.listAssignableReviews.invalidate(),
			utils.cohort.listAssignableProjects.invalidate(),
			utils.cohort.listPeerReviewReports.invalidate()
		]);
	};
	const resetEventForm = () => {
		setEditingEventId(null);
		setEventTitle('');
		setEventDescription('');
		setEventStartsAt('');
		setEventEndsAt('');
	};

	const createCohort = api.cohort.create.useMutation({
		onSuccess: async () => {
			toast.success('Cohort created');
			setName('');
			setDescription('');
			setStartsAt('');
			setEndsAt('');
			await refresh();
		},
		onError: (error) => toast.error(error.message)
	});
	const updateCohort = api.cohort.update.useMutation({
		onSuccess: refresh,
		onError: (error) => toast.error(error.message)
	});
	const addMember = api.cohort.addMember.useMutation({
		onSuccess: async () => {
			toast.success('Learner added');
			setMemberId('none');
			await utils.cohort.list.invalidate();
		},
		onError: (error) => toast.error(error.message)
	});
	const removeMember = api.cohort.removeMember.useMutation({
		onSuccess: async () => {
			toast.success('Learner removed');
			await utils.cohort.list.invalidate();
		},
		onError: (error) => toast.error(error.message)
	});
	const assignProject = api.cohort.assignProject.useMutation({
		onSuccess: async () => {
			toast.success('Collaborative project assigned');
			setProjectId('none');
			await refresh();
		},
		onError: (error) => toast.error(error.message)
	});
	const createEvent = api.cohort.createEvent.useMutation({
		onSuccess: async () => {
			toast.success('Cohort event scheduled');
			resetEventForm();
			await refresh();
		},
		onError: (error) => toast.error(error.message)
	});
	const updateEvent = api.cohort.updateEvent.useMutation({
		onSuccess: async () => {
			toast.success('Cohort event updated');
			resetEventForm();
			await refresh();
		},
		onError: (error) => toast.error(error.message)
	});
	const completeEvent = api.cohort.completeEvent.useMutation({
		onSuccess: async () => {
			toast.success('Cohort event completed');
			await refresh();
		},
		onError: (error) => toast.error(error.message)
	});
	const assignReview = api.cohort.assignPeerReview.useMutation({
		onSuccess: async () => {
			toast.success('Peer review assigned');
			setReviewerId('none');
			setReviewId('none');
			await refresh();
		},
		onError: (error) => toast.error(error.message)
	});
	const dismissReview = api.cohort.dismissPeerReview.useMutation({
		onSuccess: async () => {
			toast.success('Peer review dismissed');
			await utils.cohort.list.invalidate();
		},
		onError: (error) => toast.error(error.message)
	});
	const resolveReport = api.cohort.resolvePeerReviewReport.useMutation({
		onSuccess: async () => {
			toast.success('Peer review report resolved');
			await refresh();
		},
		onError: (error) => toast.error(error.message)
	});

	const cohorts = cohortsQuery.data ?? [];
	const selectedCohort = cohorts.find(({ id }) => id === selectedCohortId);
	const users = usersQuery.data?.users ?? [];
	const selectedCohortMembers = selectedCohort?.memberships ?? [];

	const submitEvent = () => {
		if (selectedCohortId === 'none' || !eventTitle.trim() || !eventStartsAt) {
			toast.error('Choose a cohort and provide an event title and date');
			return;
		}
		if (editingEventId) {
			updateEvent.mutate({
				id: editingEventId,
				type: eventType,
				title: eventTitle,
				description: eventDescription || null,
				startsAt: toDate(eventStartsAt),
				endsAt: eventEndsAt ? toDate(eventEndsAt) : null
			});
			return;
		}
		createEvent.mutate({
			cohortId: selectedCohortId,
			type: eventType,
			title: eventTitle,
			description: eventDescription || null,
			startsAt: toDate(eventStartsAt),
			endsAt: eventEndsAt ? toDate(eventEndsAt) : null
		});
	};

	const submitCohort = () => {
		if (!name.trim() || !startsAt) {
			toast.error('Name and start date are required');
			return;
		}
		createCohort.mutate({
			name,
			description: description || null,
			startsAt: toDate(startsAt),
			endsAt: endsAt ? toDate(endsAt) : null
		});
	};

	const changeStatus = (
		cohort: (typeof cohorts)[number],
		status: 'ACTIVE' | 'COMPLETED'
	) => {
		updateCohort.mutate({
			id: cohort.id,
			name: cohort.name,
			description: cohort.description,
			startsAt: cohort.startsAt,
			endsAt: cohort.endsAt,
			status
		});
	};

	return (
		<main className="container mx-auto space-y-6 px-4 py-8">
			<header>
				<div className="flex items-center gap-3">
					<UsersRound className="h-7 w-7 text-primary" />
					<h1 className="font-bold text-3xl">Cohorts and peer review</h1>
				</div>
				<p className="mt-2 text-muted-foreground">
					Create learning groups and assign advisory reviews without changing
					mentor reviews.
				</p>
			</header>

			<Card>
				<CardHeader>
					<CardTitle>Create cohort</CardTitle>
					<CardDescription>
						Start with a small, explicitly managed group.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2">
					<Input
						placeholder="Cohort name"
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
					<Input
						placeholder="Start date"
						type="datetime-local"
						value={startsAt}
						onChange={(event) => setStartsAt(event.target.value)}
					/>
					<Input
						placeholder="End date (optional)"
						type="datetime-local"
						value={endsAt}
						onChange={(event) => setEndsAt(event.target.value)}
					/>
					<Textarea
						placeholder="Description (optional)"
						value={description}
						onChange={(event) => setDescription(event.target.value)}
					/>
					<Button
						onClick={submitCohort}
						disabled={createCohort.isPending}
						className="md:col-span-2"
					>
						Create cohort
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Assign peer review</CardTitle>
					<CardDescription>
						Suggestions consider competency, workload, availability, authorship,
						and project conflicts. The admin still chooses the reviewer.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-3">
					<Select
						value={selectedCohortId}
						onValueChange={(value) => {
							setSelectedCohortId(value);
							setMemberId('none');
							setReviewerId('none');
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Cohort" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">Choose cohort</SelectItem>
							{cohorts.map((cohort) => (
								<SelectItem key={cohort.id} value={cohort.id}>
									{cohort.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={reviewerId} onValueChange={setReviewerId}>
						<SelectTrigger>
							<SelectValue placeholder="Reviewer" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">Choose reviewer</SelectItem>
							{selectedCohortMembers.map(({ user }) => (
								<SelectItem key={user.id} value={user.id}>
									{user.name ?? user.email}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={reviewId}
						onValueChange={(value) => {
							setReviewId(value);
							setReviewerId('none');
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Pull request" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">Choose pull request</SelectItem>
							{(reviewsQuery.data ?? []).map((review) => (
								<SelectItem key={review.id} value={review.id}>
									{review.githubTitle ?? review.prUrl}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{selectedCohortId !== 'none' && reviewId !== 'none' && (
						<div className="space-y-2 rounded-md border bg-muted/20 p-3 md:col-span-3">
							<div>
								<p className="font-medium text-sm">Suggested reviewers</p>
								<p className="text-muted-foreground text-xs">
									Choose a suggestion or keep the manual reviewer selection
									above.
								</p>
							</div>
							{suggestionsQuery.isPending && (
								<p className="text-muted-foreground text-sm">
									Finding suitable reviewers...
								</p>
							)}
							{suggestionsQuery.isError && (
								<p className="text-destructive text-sm">
									Suggestions are unavailable; choose a reviewer manually.
								</p>
							)}
							{suggestionsQuery.data?.length === 0 &&
								!suggestionsQuery.isPending &&
								!suggestionsQuery.isError && (
									<p className="text-muted-foreground text-sm">
										No eligible suggestions. You can still choose a reviewer
										manually.
									</p>
								)}
							<div className="grid gap-2 md:grid-cols-2">
								{suggestionsQuery.data?.map((suggestion, index) => (
									<div
										key={suggestion.userId}
										className="flex items-start justify-between gap-3 rounded-md border bg-background p-3"
									>
										<div className="min-w-0 text-sm">
											<p className="font-medium">
												{index + 1}. {suggestion.name ?? suggestion.email}
											</p>
											<div className="mt-1 flex flex-wrap gap-1">
												<Badge variant="secondary">
													Score {suggestion.score}
												</Badge>
												<Badge variant="outline">
													{suggestion.activeAssignmentCount} active
												</Badge>
											</div>
											<ul className="mt-2 space-y-1 text-muted-foreground text-xs">
												{suggestion.reasons.map((reason) => (
													<li key={reason}>{reason}</li>
												))}
											</ul>
										</div>
										<Button
											type="button"
											size="sm"
											variant={
												reviewerId === suggestion.userId ? 'default' : 'outline'
											}
											onClick={() => setReviewerId(suggestion.userId)}
										>
											Use
										</Button>
									</div>
								))}
							</div>
						</div>
					)}
					<Button
						onClick={() => {
							if (
								selectedCohortId === 'none' ||
								reviewerId === 'none' ||
								reviewId === 'none'
							) {
								toast.error('Choose a cohort, reviewer, and pull request');
								return;
							}
							assignReview.mutate({
								cohortId: selectedCohortId,
								reviewerId,
								pullRequestReviewId: reviewId
							});
						}}
						disabled={assignReview.isPending}
						className="md:col-span-3"
					>
						Assign review
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Assign collaborative project</CardTitle>
					<CardDescription>
						Only free projects are eligible. Active cohort members are enrolled
						automatically up to the project limit.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2">
					<Select value={selectedCohortId} onValueChange={setSelectedCohortId}>
						<SelectTrigger>
							<SelectValue placeholder="Cohort" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">Choose cohort</SelectItem>
							{cohorts.map((cohort) => (
								<SelectItem key={cohort.id} value={cohort.id}>
									{cohort.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={projectId} onValueChange={setProjectId}>
						<SelectTrigger>
							<SelectValue placeholder="Project" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">Choose project</SelectItem>
							{(projectsQuery.data ?? []).map((project) => (
								<SelectItem key={project.id} value={project.id}>
									{project.title} · max {project.maxParticipants}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						onClick={() => {
							if (selectedCohortId === 'none' || projectId === 'none') {
								toast.error('Choose a cohort and project');
								return;
							}
							assignProject.mutate({
								cohortId: selectedCohortId,
								projectId
							});
						}}
						disabled={assignProject.isPending}
						className="md:col-span-2"
					>
						Assign project
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Schedule cohort event</CardTitle>
					<CardDescription>
						Plan kickoff, checkpoints, deliveries, closure, and retrospective
						dates.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2">
					<Select value={selectedCohortId} onValueChange={setSelectedCohortId}>
						<SelectTrigger>
							<SelectValue placeholder="Cohort" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">Choose cohort</SelectItem>
							{cohorts.map((cohort) => (
								<SelectItem key={cohort.id} value={cohort.id}>
									{cohort.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={eventType}
						onValueChange={(value) => setEventType(value as CohortEventType)}
					>
						<SelectTrigger>
							<SelectValue placeholder="Event type" />
						</SelectTrigger>
						<SelectContent>
							{cohortEventTypes.map((type) => (
								<SelectItem key={type} value={type}>
									{type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Input
						placeholder="Event title"
						value={eventTitle}
						onChange={(event) => setEventTitle(event.target.value)}
					/>
					<Input
						type="datetime-local"
						value={eventStartsAt}
						onChange={(event) => setEventStartsAt(event.target.value)}
					/>
					<Input
						type="datetime-local"
						value={eventEndsAt}
						onChange={(event) => setEventEndsAt(event.target.value)}
						placeholder="End date (optional)"
					/>
					<Textarea
						placeholder="Description (optional)"
						value={eventDescription}
						onChange={(event) => setEventDescription(event.target.value)}
					/>
					<div className="flex gap-2 md:col-span-2">
						<Button
							onClick={submitEvent}
							disabled={createEvent.isPending || updateEvent.isPending}
						>
							{editingEventId ? 'Update event' : 'Schedule event'}
						</Button>
						{editingEventId && (
							<Button variant="ghost" onClick={resetEventForm}>
								Cancel edit
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			<section className="space-y-4">
				<h2 className="font-semibold text-2xl">Cohorts</h2>
				{cohorts.map((cohort) => (
					<Card key={cohort.id}>
						<CardHeader>
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div>
									<CardTitle>{cohort.name}</CardTitle>
									<CardDescription>
										{cohort.description || 'No description'}
									</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									<Badge variant="outline">{cohort.status}</Badge>
									{cohort.status === 'DRAFT' && (
										<Button
											size="sm"
											onClick={() => changeStatus(cohort, 'ACTIVE')}
										>
											Activate
										</Button>
									)}
									{cohort.status === 'ACTIVE' && (
										<Button
											size="sm"
											variant="outline"
											onClick={() => changeStatus(cohort, 'COMPLETED')}
										>
											Complete
										</Button>
									)}
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-5">
							<div>
								<h3 className="mb-2 font-medium">Collaborative projects</h3>
								{cohort.projects.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No collaborative projects assigned.
									</p>
								) : (
									<ul className="space-y-2">
										{cohort.projects.map(({ id, project }) => (
											<li
												key={id}
												className="rounded-md border px-3 py-2 text-sm"
											>
												{project.title} · max {project.maxParticipants}{' '}
												participants
											</li>
										))}
									</ul>
								)}
							</div>

							<div>
								<h3 className="mb-2 font-medium">Cohort timeline</h3>
								{cohort.events.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No events scheduled.
									</p>
								) : (
									<ul className="space-y-2">
										{cohort.events.map((event) => (
											<li
												key={event.id}
												className="flex flex-wrap items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm"
											>
												<div>
													<div className="flex flex-wrap items-center gap-2">
														<span className="font-medium">{event.title}</span>
														<Badge variant="outline">{event.type}</Badge>
														<Badge variant="secondary">{event.status}</Badge>
													</div>
													<p className="mt-1 text-muted-foreground text-xs">
														{formatEventDate(event.startsAt)}
													</p>
													{event.description && (
														<p className="mt-1 text-muted-foreground text-xs">
															{event.description}
														</p>
													)}
												</div>
												{event.status === 'PLANNED' && (
													<div className="flex gap-2">
														<Button
															size="sm"
															variant="ghost"
															onClick={() => {
																setEditingEventId(event.id);
																setSelectedCohortId(cohort.id);
																setEventType(event.type);
																setEventTitle(event.title);
																setEventDescription(event.description ?? '');
																setEventStartsAt(
																	toDateTimeLocal(event.startsAt)
																);
																setEventEndsAt(
																	event.endsAt
																		? toDateTimeLocal(event.endsAt)
																		: ''
																);
															}}
														>
															Edit
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={() =>
																completeEvent.mutate({ eventId: event.id })
															}
															disabled={completeEvent.isPending}
														>
															Complete
														</Button>
													</div>
												)}
											</li>
										))}
									</ul>
								)}
							</div>

							<div>
								<h3 className="mb-2 font-medium">Members</h3>
								<div className="flex flex-wrap gap-2">
									{cohort.memberships.map(({ id, user }) => (
										<div
											key={id}
											className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
										>
											<span>{user.name ?? user.email}</span>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													removeMember.mutate({
														cohortId: cohort.id,
														userId: user.id
													})
												}
											>
												Remove
											</Button>
										</div>
									))}
								</div>
								<div className="mt-3 flex flex-wrap gap-2">
									<Select
										value={selectedCohortId === cohort.id ? memberId : 'none'}
										onValueChange={(value) => {
											setSelectedCohortId(cohort.id);
											setMemberId(value);
										}}
									>
										<SelectTrigger className="max-w-sm">
											<SelectValue placeholder="Add learner" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">Choose learner</SelectItem>
											{users
												.filter(
													(user) =>
														!cohort.memberships.some(
															({ userId }) => userId === user.id
														)
												)
												.map((user) => (
													<SelectItem key={user.id} value={user.id}>
														{user.name ?? user.email}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
									<Button
										size="sm"
										onClick={() =>
											memberId !== 'none' &&
											addMember.mutate({
												cohortId: cohort.id,
												userId: memberId
											})
										}
										disabled={memberId === 'none' || addMember.isPending}
									>
										Add learner
									</Button>
								</div>
							</div>

							<div>
								<h3 className="mb-2 font-medium">Peer reviews</h3>
								{cohort.peerReviews.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No peer reviews assigned.
									</p>
								) : (
									<ul className="space-y-2">
										{cohort.peerReviews.map((assignment) => (
											<li
												key={assignment.id}
												className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
											>
												<div className="min-w-0">
													<p>
														{assignment.reviewer.name ??
															assignment.reviewer.email}{' '}
														→{' '}
														{assignment.author.name ?? assignment.author.email}:{' '}
														{assignment.pullRequestReview.githubTitle ??
															assignment.pullRequestReview.prUrl}
													</p>
													{assignment.feedback && (
														<p className="mt-1 whitespace-pre-wrap text-muted-foreground text-xs">
															{assignment.feedback}
														</p>
													)}
												</div>
												<div className="flex items-center gap-2">
													<Badge variant="outline">{assignment.status}</Badge>
													{assignment.status !== 'DISMISSED' && (
														<ConfirmationDialog
															title="Dismiss peer review"
															description="Dismissed feedback will no longer be visible to the learner."
															onConfirm={() =>
																dismissReview.mutate({
																	assignmentId: assignment.id
																})
															}
														>
															<Button variant="ghost" size="sm">
																Dismiss
															</Button>
														</ConfirmationDialog>
													)}
												</div>
											</li>
										))}
									</ul>
								)}
							</div>
						</CardContent>
					</Card>
				))}
				{!cohortsQuery.isLoading && cohorts.length === 0 && (
					<Card>
						<CardContent className="p-6 text-muted-foreground">
							No cohorts yet.
						</CardContent>
					</Card>
				)}
			</section>

			<Card>
				<CardHeader>
					<CardTitle>Peer review reports</CardTitle>
					<CardDescription>
						Resolve reports to remove harmful feedback or dismiss a report that
						does not violate the cohort rules.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{(reportsQuery.data ?? []).length === 0 ? (
						<p className="text-muted-foreground text-sm">No open reports.</p>
					) : (
						(reportsQuery.data ?? []).map((report) => (
							<div
								key={report.id}
								className="space-y-2 rounded-md border p-3 text-sm"
							>
								<p className="font-medium">
									{report.assignment.reviewer.name ??
										report.assignment.reviewer.email}{' '}
									→{' '}
									{report.assignment.author.name ??
										report.assignment.author.email}
								</p>
								<p>{report.reason}</p>
								<p className="whitespace-pre-wrap text-muted-foreground text-xs">
									{report.assignment.feedback}
								</p>
								<div className="flex flex-wrap gap-2">
									<ConfirmationDialog
										title="Remove reported feedback"
										description="This will dismiss the peer review and remove it from the learner's view."
										onConfirm={() =>
											resolveReport.mutate({
												reportId: report.id,
												status: 'RESOLVED',
												resolutionNote: null
											})
										}
									>
										<Button size="sm">Remove feedback</Button>
									</ConfirmationDialog>
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											resolveReport.mutate({
												reportId: report.id,
												status: 'DISMISSED',
												resolutionNote: null
											})
										}
									>
										Dismiss report
									</Button>
								</div>
							</div>
						))
					)}
				</CardContent>
			</Card>
		</main>
	);
}
