'use client';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { api } from '~/trpc/react';
import { InlineBooker } from './inline-booker';
import { MyBookingsList } from './my-bookings-list';
import WeeklyInfo from './weekly-info/weekly-info';
import { WeeklyInfoSkeleton } from './weekly-info/weekly-info-skeleton';

export function MentorshipDashboard() {
	const { data, isLoading } = api.mentorship.getMyMentorshipWeekInfo.useQuery();

	return (
		<div className="space-y-6">
			{isLoading ? (
				<WeeklyInfoSkeleton />
			) : (
				data && (
					<WeeklyInfo
						weekInfo={data}
						hasAvailableSessions={data.hasAvailableSessions}
					/>
				)
			)}

			<MyBookingsList />

			{data?.hasAvailableSessions && (
				<Card>
					<CardHeader>
						<CardTitle>Book Your Next Session</CardTitle>
						<CardDescription>
							Select an available time slot with your mentor.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<InlineBooker />
					</CardContent>
				</Card>
			)}
		</div>
	);
}
