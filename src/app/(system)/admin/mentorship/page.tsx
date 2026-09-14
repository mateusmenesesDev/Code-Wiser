'use client';

import { ExternalLink } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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

type SessionStatus =
	| 'SCHEDULED'
	| 'COMPLETED'
	| 'CANCELLED'
	| 'MENTOR_CANCELLED';
type ActionStatus =
	| 'PENDING'
	| 'IN_PROGRESS'
	| 'SUBMITTED'
	| 'COMPLETED'
	| 'CANCELLED';
type CompetencyAssessmentState = 'IN_DEVELOPMENT' | 'DEMONSTRATED';
type CompetencyAssessment = {
	competencyId: string;
	state: CompetencyAssessmentState;
	note: string;
};
type ActionTarget =
	| { type: 'MENTORSHIP' }
	| { type: 'TASK'; taskId: string }
	| { type: 'EXERCISE'; challengeId: string };

function toDateTimeLocal(value: Date | null) {
	if (!value) return '';
	const date = new Date(value);
	const offset = date.getTimezoneOffset();
	return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export default function AdminMentorshipPage() {
	const bookingId = useSearchParams().get('bookingId');
	const [objective, setObjective] = useState('');
	const [sessionNotes, setSessionNotes] = useState('');
	const [mentorPrivateNote, setMentorPrivateNote] = useState('');
	const [followUp, setFollowUp] = useState('');
	const [actionDueAt, setActionDueAt] = useState('');
	const [actionStatus, setActionStatus] = useState<ActionStatus | 'NONE'>(
		'NONE'
	);
	const [actionTarget, setActionTarget] = useState<ActionTarget>({
		type: 'MENTORSHIP'
	});
	const [status, setStatus] = useState<SessionStatus>('SCHEDULED');
	const [competencyAssessments, setCompetencyAssessments] = useState<
		CompetencyAssessment[]
	>([]);
	const {
		data: booking,
		isLoading,
		error
	} = api.mentorship.adminGetBooking.useQuery(
		{ bookingId: bookingId ?? '' },
		{ enabled: Boolean(bookingId) }
	);
	const { data: competencyCatalog } = api.competency.getCatalog.useQuery();

	useEffect(() => {
		if (booking) {
			setObjective(booking.objective ?? '');
			setSessionNotes(booking.sessionNotes ?? '');
			setMentorPrivateNote(booking.mentorPrivateNote ?? '');
			setFollowUp(booking.followUp ?? '');
			setActionDueAt(toDateTimeLocal(booking.actionDueAt));
			const previousAction = booking.remediationActions[0];
			setActionStatus(
				previousAction?.status === 'OPEN'
					? 'PENDING'
					: (previousAction?.status ?? booking.actionStatus ?? 'NONE')
			);
			setActionTarget(
				previousAction?.task
					? { type: 'TASK', taskId: previousAction.task.id }
					: previousAction?.challenge
						? { type: 'EXERCISE', challengeId: previousAction.challenge.id }
						: { type: 'MENTORSHIP' }
			);
			setStatus(booking.status);
			setCompetencyAssessments(
				booking.competencyAssessments.map((assessment) => ({
					competencyId: assessment.competencyId,
					state: assessment.state,
					note: assessment.note ?? ''
				}))
			);
		}
	}, [booking]);

	const utils = api.useUtils();
	const updateMutation = api.mentorship.updateSessionNotes.useMutation({
		onSuccess: async () => {
			if (!bookingId) return;
			toast.success('Session notes saved');
			await Promise.all([
				utils.mentorship.adminGetBooking.invalidate({ bookingId }),
				utils.mentorAttention.getQueue.invalidate()
			]);
		},
		onError: (mutationError) => toast.error(mutationError.message)
	});

	if (!bookingId) {
		return (
			<div className="container mx-auto px-4 py-8">
				<h1 className="font-bold text-3xl">Mentorship session</h1>
				<p className="mt-2 text-muted-foreground">
					Open a session from the mentor attention queue.
				</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8 text-muted-foreground">
				Loading session...
			</div>
		);
	}

	if (error || !booking) {
		return (
			<div className="container mx-auto px-4 py-8 text-muted-foreground">
				Session not found.
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<div className="mb-8">
				<h1 className="font-bold text-3xl">Mentorship session</h1>
				<p className="mt-2 text-muted-foreground">
					{booking.user.name || booking.user.email} ·{' '}
					{new Date(booking.scheduledAt).toLocaleString()}
				</p>
				<Badge className="mt-3" variant="outline">
					{booking.status}
				</Badge>
			</div>

			{booking.remediationActions[0] && (
				<Card className="mb-6 border-info-border bg-info-muted">
					<CardHeader>
						<CardTitle>Follow-up review</CardTitle>
						<CardDescription>
							Review the learner's previous action before recording this
							session.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<div className="flex flex-wrap gap-2">
							<strong>{booking.remediationActions[0].title}</strong>
							<Badge variant="outline">
								{booking.remediationActions[0].status}
							</Badge>
						</div>
						{booking.remediationActions[0].evidenceNote && (
							<p>
								<strong>Evidence:</strong>{' '}
								{booking.remediationActions[0].evidenceNote}
							</p>
						)}
						{booking.remediationActions[0].reviewerNote && (
							<p className="text-muted-foreground">
								<strong>Review note:</strong>{' '}
								{booking.remediationActions[0].reviewerNote}
							</p>
						)}
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Session context</CardTitle>
					<CardDescription>
						Record the learner's objective, shared notes, private observations,
						and the agreed action.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="space-y-2">
						<label htmlFor="session-objective" className="font-medium text-sm">
							Objective
						</label>
						<Textarea
							id="session-objective"
							value={objective}
							onChange={(event) => setObjective(event.target.value)}
							maxLength={2000}
							rows={4}
							placeholder="What should this session accomplish?"
						/>
					</div>
					<div className="space-y-2">
						<label htmlFor="session-notes" className="font-medium text-sm">
							Shared session notes
						</label>
						<Textarea
							id="session-notes"
							value={sessionNotes}
							onChange={(event) => setSessionNotes(event.target.value)}
							maxLength={5000}
							rows={5}
							placeholder="What did you cover during the session?"
						/>
					</div>
					<div className="space-y-2">
						<label
							htmlFor="mentor-private-note"
							className="font-medium text-sm"
						>
							Private mentor note
						</label>
						<Textarea
							id="mentor-private-note"
							value={mentorPrivateNote}
							onChange={(event) => setMentorPrivateNote(event.target.value)}
							maxLength={5000}
							rows={5}
							placeholder="Observations for mentors only"
						/>
					</div>
					<div className="space-y-2">
						<label htmlFor="session-follow-up" className="font-medium text-sm">
							Agreed action
						</label>
						<Textarea
							id="session-follow-up"
							value={followUp}
							onChange={(event) => setFollowUp(event.target.value)}
							maxLength={2000}
							rows={4}
							placeholder="What will the learner do next?"
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<div className="space-y-2">
							<label htmlFor="action-target" className="font-medium text-sm">
								Learning target
							</label>
							<Select
								value={
									actionTarget.type === 'TASK'
										? `TASK:${actionTarget.taskId}`
										: actionTarget.type === 'EXERCISE'
											? `EXERCISE:${actionTarget.challengeId}`
											: 'MENTORSHIP'
								}
								onValueChange={(value) => {
									const [type, id] = value.split(':');
									setActionTarget(
										type === 'TASK' && id
											? { type: 'TASK', taskId: id }
											: type === 'EXERCISE' && id
												? { type: 'EXERCISE', challengeId: id }
												: { type: 'MENTORSHIP' }
									);
								}}
							>
								<SelectTrigger id="action-target">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="MENTORSHIP">
										Mentorship follow-up
									</SelectItem>
									{booking.actionOptions.tasks.map((task) => (
										<SelectItem key={task.id} value={`TASK:${task.id}`}>
											Task: {task.title} ({task.project?.title})
										</SelectItem>
									))}
									{booking.actionOptions.challenges.map((challenge) => (
										<SelectItem
											key={challenge.id}
											value={`EXERCISE:${challenge.id}`}
										>
											Exercise: {challenge.title} ({challenge.track.name})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<label htmlFor="action-due-at" className="font-medium text-sm">
								Action deadline
							</label>
							<input
								id="action-due-at"
								type="datetime-local"
								value={actionDueAt}
								onChange={(event) => setActionDueAt(event.target.value)}
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="action-status" className="font-medium text-sm">
								Action status
							</label>
							<Select
								value={actionStatus}
								onValueChange={(value) =>
									setActionStatus(value as ActionStatus | 'NONE')
								}
							>
								<SelectTrigger id="action-status">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="NONE">No action</SelectItem>
									<SelectItem value="PENDING">Pending</SelectItem>
									<SelectItem value="IN_PROGRESS">In progress</SelectItem>
									<SelectItem value="SUBMITTED">Awaiting review</SelectItem>
									<SelectItem value="COMPLETED">Completed</SelectItem>
									<SelectItem value="CANCELLED">Cancelled</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<label htmlFor="session-status" className="font-medium text-sm">
								Session status
							</label>
							<Select
								value={status}
								onValueChange={(value) => setStatus(value as SessionStatus)}
							>
								<SelectTrigger id="session-status">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="SCHEDULED">Scheduled</SelectItem>
									<SelectItem value="COMPLETED">Completed</SelectItem>
									<SelectItem value="CANCELLED">Cancelled</SelectItem>
									<SelectItem value="MENTOR_CANCELLED">
										Cancelled by mentor
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="space-y-4 rounded-lg border bg-muted/30 p-4">
						<div>
							<h2 className="font-semibold text-base">Competency evidence</h2>
							<p className="mt-1 text-muted-foreground text-sm">
								Record only competencies discussed and supported by this
								session.
							</p>
						</div>
						<div className="space-y-3">
							{competencyCatalog?.map((competency) => {
								const assessment = competencyAssessments.find(
									(item) => item.competencyId === competency.id
								);
								return (
									<div
										key={competency.id}
										className="grid gap-3 rounded-md border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_180px]"
									>
										<div>
											<p className="font-medium text-sm">{competency.name}</p>
											<p className="mt-1 text-muted-foreground text-xs">
												{competency.description}
											</p>
											{assessment && (
												<Input
													className="mt-2"
													value={assessment.note}
													maxLength={2000}
													placeholder="Evidence note (optional)"
													onChange={(event) =>
														setCompetencyAssessments((current) =>
															current.map((item) =>
																item.competencyId === competency.id
																	? { ...item, note: event.target.value }
																	: item
															)
														)
													}
												/>
											)}
										</div>
										<Select
											value={assessment?.state ?? 'NONE'}
											onValueChange={(value) =>
												setCompetencyAssessments((current) =>
													value === 'NONE'
														? current.filter(
																(item) => item.competencyId !== competency.id
															)
														: [
																...current.filter(
																	(item) => item.competencyId !== competency.id
																),
																{
																	competencyId: competency.id,
																	state: value as CompetencyAssessmentState,
																	note: assessment?.note ?? ''
																}
															]
												)
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="NONE">Not assessed</SelectItem>
												<SelectItem value="IN_DEVELOPMENT">
													In development
												</SelectItem>
												<SelectItem value="DEMONSTRATED">
													Demonstrated
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								);
							})}
						</div>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							onClick={() =>
								updateMutation.mutate({
									bookingId,
									objective: objective.trim() || null,
									sessionNotes: sessionNotes.trim() || null,
									mentorPrivateNote: mentorPrivateNote.trim() || null,
									followUp: followUp.trim() || null,
									actionDueAt:
										followUp.trim() && actionDueAt
											? new Date(actionDueAt).toISOString()
											: null,
									actionStatus:
										followUp.trim() && actionStatus !== 'NONE'
											? actionStatus
											: null,
									actionTarget: followUp.trim() ? actionTarget : null,
									status,
									competencyAssessments: competencyAssessments.map(
										({ competencyId, state, note }) => ({
											competencyId,
											state,
											note: note.trim() || null
										})
									)
								})
							}
							disabled={updateMutation.isPending}
						>
							{updateMutation.isPending ? 'Saving…' : 'Save session record'}
						</Button>
						{booking.bookingUrl && (
							<Button variant="outline" asChild>
								<a href={booking.bookingUrl} target="_blank" rel="noreferrer">
									<ExternalLink className="mr-2 h-4 w-4" />
									Open booking
								</a>
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
