'use client';

import { CheckCircle2, CircleDot, GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '~/common/components/ui/badge';
import { Card, CardContent } from '~/common/components/ui/card';
import { Progress } from '~/common/components/ui/progress';
import { Skeleton } from '~/common/components/ui/skeleton';
import { api } from '~/trpc/react';

type CompetencyMatrixProps = {
	userId?: string;
};

function stateProgress(state: string) {
	if (state === 'DEMONSTRATED') return 100;
	if (state === 'IN_DEVELOPMENT') return 50;
	return 0;
}

export function CompetencyMatrix({ userId }: CompetencyMatrixProps) {
	const t = useTranslations('dashboard.competencies');
	const { data, isLoading, error } = api.competency.getMatrix.useQuery(
		userId ? { userId } : undefined
	);

	if (isLoading) {
		return (
			<section aria-label={t('title')} className="space-y-3">
				<Skeleton className="h-16 bg-muted" />
				<div className="grid gap-3 md:grid-cols-2">
					{[1, 2, 3, 4].map((item) => (
						<Skeleton key={item} className="h-36 bg-muted" />
					))}
				</div>
			</section>
		);
	}

	if (error || !data) return null;

	return (
		<section aria-label={t('title')} className="space-y-3">
			<div>
				<div className="flex items-center gap-2">
					<GraduationCap className="h-5 w-5 text-primary" aria-hidden="true" />
					<h2 className="font-semibold text-base">{t('title')}</h2>
				</div>
				<p className="mt-1 text-muted-foreground text-sm">{t('description')}</p>
			</div>
			<div className="grid gap-3 md:grid-cols-2">
				{data.map((competency) => (
					<Card key={competency.slug} className="shadow-none">
						<CardContent className="space-y-4 p-5">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<h3 className="font-semibold text-sm">{competency.name}</h3>
									<p className="mt-1 text-muted-foreground text-xs">
										{competency.description}
									</p>
								</div>
								<Badge
									variant="outline"
									className={
										competency.state === 'DEMONSTRATED'
											? 'shrink-0 border-success-border bg-success-muted text-success-muted-foreground'
											: competency.state === 'IN_DEVELOPMENT'
												? 'shrink-0 border-warning-border bg-warning-muted text-warning-muted-foreground'
												: 'shrink-0'
									}
								>
									{t(`states.${competency.state}`)}
								</Badge>
							</div>
							<Progress
								value={stateProgress(competency.state)}
								className="h-1.5 bg-muted [&>div]:bg-primary"
							/>
							<p className="text-[11px] text-muted-foreground">
								{t('mappedResources', {
									count:
										competency.mappedResources.exercises +
										competency.mappedResources.learningOutcomes +
										competency.mappedResources.milestones +
										competency.mappedResources.reviewCategories
								})}
							</p>
							{competency.evidence.length > 0 ? (
								<div className="space-y-2">
									<p className="font-medium text-xs">{t('evidence')}</p>
									{competency.evidence.map((item) => (
										<div
											key={`${item.source}-${item.title}-${item.date}`}
											className="flex gap-2 text-xs"
										>
											{item.state === 'DEMONSTRATED' ? (
												<CheckCircle2
													className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
													aria-hidden="true"
												/>
											) : (
												<CircleDot
													className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning"
													aria-hidden="true"
												/>
											)}
											<span className="min-w-0">
												<span className="block truncate font-medium">
													{item.title}
												</span>
												<span className="mt-0.5 block text-muted-foreground">
													{t(`sources.${item.source}`)} · {item.detail}
												</span>
											</span>
										</div>
									))}
								</div>
							) : (
								<p className="text-muted-foreground text-xs">
									{t('noEvidence')}
								</p>
							)}
						</CardContent>
					</Card>
				))}
			</div>
		</section>
	);
}
