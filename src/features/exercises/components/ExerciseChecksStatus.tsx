'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '~/common/components/ui/badge';

type ExerciseChecksStatusProps = {
	status?: string | null;
};

const STATUS_VALUES = new Set(['SUCCESS', 'FAILURE', 'PENDING', 'NONE']);

export function ExerciseChecksStatus({ status }: ExerciseChecksStatusProps) {
	const t = useTranslations('exerciseChecks');
	const normalizedStatus =
		status && STATUS_VALUES.has(status) ? status : 'UNAVAILABLE';
	const variant =
		normalizedStatus === 'SUCCESS'
			? 'success'
			: normalizedStatus === 'FAILURE'
				? 'destructive'
				: normalizedStatus === 'PENDING'
					? 'warning'
					: 'secondary';

	return (
		<div className="space-y-2 rounded-md border bg-muted/20 p-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="font-medium text-sm">{t('title')}</p>
				<Badge variant={variant}>{t(`status.${normalizedStatus}`)}</Badge>
			</div>
			<p className="text-muted-foreground text-sm">
				{t(`description.${normalizedStatus}`)}
			</p>
		</div>
	);
}
