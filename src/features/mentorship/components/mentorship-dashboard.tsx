'use client';

import { api } from '~/trpc/react';
import { MentorshipCalendar } from './mentorship-calendar';
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

			<MentorshipCalendar />
		</div>
	);
}
