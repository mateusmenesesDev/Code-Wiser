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
import { Textarea } from '~/common/components/ui/textarea';
import { api } from '~/trpc/react';

export default function AdminMentorshipPage() {
	const bookingId = useSearchParams().get('bookingId');
	const [objective, setObjective] = useState('');
	const [followUp, setFollowUp] = useState('');
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
			setFollowUp(booking.followUp ?? '');
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
						Record the learner's objective before the session and the agreed
						follow-up afterward.
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
							rows={5}
							placeholder="What should this session accomplish?"
						/>
					</div>
					<div className="space-y-2">
						<label htmlFor="session-follow-up" className="font-medium text-sm">
							Follow-up
						</label>
						<Textarea
							id="session-follow-up"
							value={followUp}
							onChange={(event) => setFollowUp(event.target.value)}
							maxLength={2000}
							rows={5}
							placeholder="What will the learner do next?"
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							onClick={() =>
								updateMutation.mutate({
									bookingId,
									objective: objective.trim() || null,
									followUp: followUp.trim() || null
								})
							}
							disabled={updateMutation.isPending}
						>
							{updateMutation.isPending ? 'Saving…' : 'Save notes'}
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
