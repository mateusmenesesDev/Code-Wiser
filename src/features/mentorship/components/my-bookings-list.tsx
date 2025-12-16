'use client';

import { Calendar, Clock, ExternalLink, Video, X } from 'lucide-react';
import { useState } from 'react';
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
import { api } from '~/trpc/react';
import { toast } from 'sonner';
import {
	formatSessionDate,
	formatSessionTime
} from '../utils/mentorshipAccess';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';

export function MyBookingsList() {
	const utils = api.useUtils();
	const { data: bookings, isLoading } = api.mentorship.getMyBookings.useQuery();
	const [_cancellingId, setCancellingId] = useState<string | null>(null);

	const cancelBookingMutation = api.mentorship.cancelBooking.useMutation({
		onSuccess: async () => {
			toast.success('Booking cancelled successfully');

			await utils.mentorship.getMyBookings.invalidate();
			await utils.mentorship.getMyMentorshipWeekInfo.invalidate();

			setCancellingId(null);
		},
		onError: (error) => {
			toast.error(`Failed to cancel booking: ${error.message}`);
		}
	});

	const handleCancelBooking = (bookingId: string) => {
		cancelBookingMutation.mutate({ bookingId });
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
		(b) => b.status === 'SCHEDULED' && new Date(b.scheduledAt) > new Date()
	);
	const pastBookings = bookings?.filter(
		(b) =>
			b.status !== 'SCHEDULED' ||
			(b.status === 'SCHEDULED' && new Date(b.scheduledAt) <= new Date())
	);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>My Bookings</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8">
						<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Upcoming Bookings */}
			<Card>
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
									<TableHead>Links</TableHead>
									<TableHead className="text-right">Actions</TableHead>
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
										<TableCell>
											<div className="flex items-center gap-2">
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
											</div>
										</TableCell>
										<TableCell className="text-right">
											{booking.status === 'SCHEDULED' && (
												<ConfirmationDialog
													title="Cancel Session"
													description="Are you sure you want to cancel this session? Your weekly session count will be restored."
													onConfirm={() => handleCancelBooking(booking.id)}
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
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Past Bookings */}
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
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
