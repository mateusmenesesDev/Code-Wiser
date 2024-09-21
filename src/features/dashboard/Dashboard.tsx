'use client';
import { ActiveProjects } from './components/ActiveProjects';
import { DashboardCards } from './components/DashboardCards';
import { RecentActivity } from './components/RecentActivity';
import { UpcomingMeetings } from './components/UpcomingMeetings';

export default function Dashboard() {
	return (
		<div className="space-y-6 p-6">
			<DashboardCards />
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<ActiveProjects />
				<UpcomingMeetings />
			</div>
			<RecentActivity />
		</div>
	);
}
