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
type ActionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

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
	const [status, setStatus] = useState<SessionStatus>('SCHEDULED');
	const {
		data: booking,
		isLoading,
		error
	} = api.mentorship.adminGetBooking.useQuery(
		{ bookingId: bookingId ?? '' },
		{ enabled: Boolean(bookingId) }
	);

	useEffect(() => {
		if (booking) {
			setObjective(booking.objective ?? '');
			setSessionNotes(booking.sessionNotes ?? '');
			setMentorPrivateNote(booking.mentorPrivateNote ?? '');
			setFollowUp(booking.followUp ?? '');
			setActionDueAt(toDateTimeLocal(booking.actionDueAt));
			setActionStatus(booking.actionStatus ?? 'NONE');
			setStatus(booking.status);
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
					<div className="grid gap-4 sm:grid-cols-3">
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
									status
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
