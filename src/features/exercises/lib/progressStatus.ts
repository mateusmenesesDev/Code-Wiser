import type { UserChallengeProgressStatus } from '@prisma/client';

export const PROGRESS_STATUS_LABELS: Record<
	UserChallengeProgressStatus,
	string
> = {
	NOT_STARTED: 'Not started',
	IN_PROGRESS: 'In progress',
	IN_REVIEW: 'In review',
	APPROVED: 'Approved',
	CHANGES_REQUESTED: 'Changes requested'
};

export function progressStatusBadgeVariant(
	status: UserChallengeProgressStatus
): 'secondary' | 'outline' | 'warning' | 'success' | 'destructive' {
	switch (status) {
		case 'NOT_STARTED':
			return 'secondary';
		case 'IN_PROGRESS':
			return 'outline';
		case 'IN_REVIEW':
			return 'warning';
		case 'APPROVED':
			return 'success';
		case 'CHANGES_REQUESTED':
			return 'destructive';
	}
}
