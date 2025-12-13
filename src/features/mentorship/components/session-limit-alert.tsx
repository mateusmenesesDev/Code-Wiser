'use client';

import { AlertCircle, Calendar } from 'lucide-react';
import {
	Alert,
	AlertDescription,
	AlertTitle
} from '~/common/components/ui/alert';
import { formatSessionDate } from '../utils/mentorshipAccess';

interface SessionLimitAlertProps {
	resetDate: Date;
}

export function SessionLimitAlert({ resetDate }: SessionLimitAlertProps) {
	return (
		<Alert variant="destructive" className="mb-6">
			<AlertCircle className="h-4 w-4" />
			<AlertTitle>Weekly Session Limit Reached</AlertTitle>
			<AlertDescription>
				<p className="mb-2">
					You have used all your mentorship sessions for this week.
				</p>
				<div className="flex items-center gap-2 text-sm">
					<Calendar className="h-4 w-4" />
					<span>
						Your sessions will reset on{' '}
						<strong>{formatSessionDate(resetDate)}</strong>
					</span>
				</div>
			</AlertDescription>
		</Alert>
	);
}
