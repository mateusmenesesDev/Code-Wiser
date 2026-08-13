'use client';

import {
	Calendar,
	Clock,
	ExternalLink,
	RefreshCw,
	Video,
	X
} from 'lucide-react';
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';
import { api, type RouterOutputs } from '~/trpc/react';
import {
	formatSessionDate,
	formatSessionTime
} from '../utils/mentorshipAccess';
import { RescheduleModal } from './reschedule-modal';

type Booking = RouterOutputs['mentorship']['getMyBookings'][number];

function SessionContext({ booking }: { booking: Booking }) {
	if (!booking.objective && !booking.sessionNotes && !booking.followUp) {
		return <span className="text-muted-foreground">No notes recorded</span>;
	}

	return (
		<div className="space-y-1">
			{booking.objective && (
				<p>
					<strong>Objective:</strong> {booking.objective}
				</p>
			)}
			{booking.sessionNotes && <p>{booking.sessionNotes}</p>}
			{booking.followUp && (
				<p>
					<strong>Agreed action:</strong> {booking.followUp}
					{booking.actionStatus && (
						<span className="ml-1 text-muted-foreground">
							({booking.actionStatus.replace('_', ' ').toLowerCase()})
						</span>
					)}
					{booking.actionDueAt && (
						<span className="block text-muted-foreground">
							Due {formatSessionDate(booking.actionDueAt)}
						</span>
					)}
				</p>
			)}
		</div>
	);
}

export function MyBookingsList({ readOnly = false }: { readOnly?: boolean }) {
	const utils = api.useUtils();
	const {
		data: bookings,
		isLoading,
		isError,
		refetch
	} = api.mentorship.getMyBookings.useQuery();
	const [rescheduleBookingId, setRescheduleBookingId] = useState<
		string | undefined
	>();

	const cancelBookingMutation = api.mentorship.cancelBooking.useMutation({
		onSuccess: async () => {
			toast.success('Booking cancelled successfully');

			await utils.mentorship.getMyBookings.invalidate();
			await utils.mentorship.getMyMentorshipWeekInfo.invalidate();
			await utils.mentorship.getAvailableSlots.invalidate();
		},
		onError: (error) => {
			toast.error(`Failed to cancel booking: ${error.message}`);
		}
	});

	const handleRescheduleSuccess = async () => {
		toast.success('Session rescheduled successfully');
		await utils.mentorship.getMyBookings.invalidate();
		await utils.mentorship.getMyMentorshipWeekInfo.invalidate();
		await utils.mentorship.getAvailableSlots.invalidate();
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'SCHEDULED':
				return <Badge variant="default">Scheduled</Badge>;
			case 'COMPLETED':
				return <Badge variant="secondary">Completed</Badge>;
			case 'CANCELLED':
				return <Badge variant="destructive">Cancelled</Badge>;
			case 'MENTOR_CANCELLED':
				return <Badge variant="destructive">Cancelled by Mentor</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const upcomingBookings = bookings?.filter(
		(booking) =>
			booking.status === 'SCHEDULED' &&
			new Date(booking.scheduledAt) > new Date()
	);
	const pastBookings = bookings?.filter(
		(booking) =>
			booking.status !== 'SCHEDULED' ||
			(booking.status === 'SCHEDULED' &&
				new Date(booking.scheduledAt) <= new Date())
	);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Mentorship history</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8">
						<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (isError) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Mentorship history</CardTitle>
					<CardDescription>
						Your session history could not be loaded.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card data-onboarding="mentorship-bookings">
				<CardHeader>
					<CardTitle>Upcoming Sessions</CardTitle>
					<CardDescription>Your scheduled mentorship sessions</CardDescription>
				</CardHeader>
				<CardContent>
					{!upcomingBookings || upcomingBookings.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground">
							<Calendar className="mx-auto mb-2 h-12 w-12 opacity-50" />
							<p>No upcoming sessions scheduled</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Time</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Session context</TableHead>
									<TableHead>Links</TableHead>
									{!readOnly && (
										<TableHead className="text-right">Actions</TableHead>
									)}
								</TableRow>
							</TableHeader>
							<TableBody>
								{upcomingBookings.map((booking) => (
									<TableRow key={booking.id}>
										<TableCell>
											<div className="flex items-center gap-2">
												<Calendar className="h-4 w-4 text-muted-foreground" />
												{formatSessionDate(booking.scheduledAt)}
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Clock className="h-4 w-4 text-muted-foreground" />
												{formatSessionTime(booking.scheduledAt)}
											</div>
										</TableCell>
										<TableCell>{getStatusBadge(booking.status)}</TableCell>
										<TableCell className="max-w-sm text-sm">
											<SessionContext booking={booking} />
										</TableCell>
										<TableCell>
											{booking.meetingUrl ? (
												<Button variant="default" size="sm" asChild>
													<a
														href={booking.meetingUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="flex items-center gap-1"
													>
														<Video className="h-4 w-4" />
														<span className="hidden sm:inline">
															Join Meeting
														</span>
													</a>
												</Button>
											) : booking.bookingUrl ? (
												<Button variant="outline" size="sm" asChild>
													<a
														href={booking.bookingUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="flex items-center gap-1"
													>
														<ExternalLink className="h-4 w-4" />
														<span className="hidden sm:inline">
															View Details
														</span>
													</a>
												</Button>
											) : (
												<span className="text-muted-foreground text-sm">
													No link available
												</span>
											)}
										</TableCell>
										{!readOnly && (
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-1">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => setRescheduleBookingId(booking.id)}
														disabled={cancelBookingMutation.isPending}
													>
														<RefreshCw className="mr-1 h-4 w-4" />
														Reschedule
													</Button>
													<ConfirmationDialog
														title="Cancel Session"
														description="Are you sure you want to cancel this session? Your weekly session count will be restored."
														onConfirm={() =>
															cancelBookingMutation.mutate({
																bookingId: booking.id
															})
														}
													>
														<Button
															variant="ghost"
															size="sm"
															disabled={cancelBookingMutation.isPending}
														>
															<X className="mr-1 h-4 w-4" />
															Cancel
														</Button>
													</ConfirmationDialog>
												</div>
											</TableCell>
										)}
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{pastBookings && pastBookings.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Past Sessions</CardTitle>
						<CardDescription>Your session history</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Time</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Session context</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pastBookings.map((booking) => (
									<TableRow key={booking.id}>
										<TableCell>
											<div className="flex items-center gap-2">
												<Calendar className="h-4 w-4 text-muted-foreground" />
												{formatSessionDate(booking.scheduledAt)}
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Clock className="h-4 w-4 text-muted-foreground" />
												{formatSessionTime(booking.scheduledAt)}
											</div>
										</TableCell>
										<TableCell>{getStatusBadge(booking.status)}</TableCell>
										<TableCell className="max-w-sm text-sm">
											<SessionContext booking={booking} />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}

			{rescheduleBookingId && !readOnly && (
				<RescheduleModal
					bookingId={rescheduleBookingId}
					open={!!rescheduleBookingId}
					onOpenChange={(open) => {
						if (!open) setRescheduleBookingId(undefined);
					}}
					onSuccess={handleRescheduleSuccess}
				/>
			)}
		</div>
	);
}
