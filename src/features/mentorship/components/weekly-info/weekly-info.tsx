import { Calendar, Clock } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Progress } from '~/common/components/ui/progress';
import { formatSessionDate } from '~/features/mentorship/utils/mentorshipAccess';
import type { api } from '~/trpc/server';
import { SessionLimitAlert } from '../session-limit-alert';

export default function WeeklyInfo({
	weekInfo,
	hasAvailableSessions
}: {
	weekInfo: Awaited<ReturnType<typeof api.mentorship.getMyMentorshipWeekInfo>>;
	hasAvailableSessions: boolean;
}) {
	const sessionsUsed =
		weekInfo.weeklyMentorshipSessions - weekInfo.remainingWeeklySessions;
	const progressPercentage =
		(sessionsUsed / weekInfo.weeklyMentorshipSessions) * 100;

	return (
		<>
			{/* Session Limit Alert */}
			{!hasAvailableSessions && weekInfo.weeklySessionsResetAt && (
				<SessionLimitAlert resetDate={weekInfo.weeklySessionsResetAt} />
			)}

			{/* Mentorship Overview */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Weekly Sessions
						</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{weekInfo.weeklyMentorshipSessions}
						</div>
						<p className="text-muted-foreground text-xs">sessions per week</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Remaining This Week
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{weekInfo.remainingWeeklySessions}
						</div>
						<p className="text-muted-foreground text-xs">sessions available</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Next Reset</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{weekInfo.weeklySessionsResetAt
								? formatSessionDate(weekInfo.weeklySessionsResetAt)
								: 'N/A'}
						</div>
						<p className="text-muted-foreground text-xs">sessions will reset</p>
					</CardContent>
				</Card>
			</div>

			{/* Session Usage Progress */}
			<Card>
				<CardHeader>
					<CardTitle>Session Usage</CardTitle>
					<CardDescription>
						You've used {sessionsUsed} of {weekInfo.weeklyMentorshipSessions}{' '}
						sessions this week
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Progress value={progressPercentage} className="h-2" />
				</CardContent>
			</Card>
		</>
	);
}
