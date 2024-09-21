import dayjs from 'dayjs';
import Link from 'next/link';
import { Button } from '~/common/components/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '~/common/components/card';
import { upcomingMeetings } from '../mocks/dashboardData';

export function UpcomingMeetings() {
	return (
		<Card className="flex min-h-[300px] flex-col">
			<CardHeader>
				<CardTitle>Upcoming Meetings</CardTitle>
				<CardDescription>Your scheduled mentorship sessions</CardDescription>
			</CardHeader>
			<CardContent>
				{upcomingMeetings.map((meeting) => (
					<div
						key={meeting.id}
						className="flex items-center justify-between py-2"
					>
						<div>
							<h4 className="font-medium text-sm">{meeting.title}</h4>
							<p className="text-muted-foreground text-xs">
								with {meeting.mentor}
							</p>
						</div>
						<div className="text-muted-foreground text-sm">
							{dayjs(meeting.dateTime).format('L LT')}
						</div>
					</div>
				))}
			</CardContent>
			<CardFooter className="mt-auto">
				<Button asChild>
					<Link href="/meetings">View All Meetings</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}
