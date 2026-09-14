'use client';

import { ArrowRight, CheckCircle2, CircleDot, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Textarea } from '~/common/components/ui/textarea';
import { api } from '~/trpc/react';

function getActionHref(action: {
	targetType: string;
	task?: { id: string; projectId: string | null } | null;
	challenge?: { slug: string; track: { slug: string } } | null;
	bookingId: string | null;
}) {
	if (action.targetType === 'TASK' && action.task?.projectId) {
		return `/workspace/${action.task.projectId}?taskId=${action.task.id}`;
	}
	if (action.targetType === 'EXERCISE' && action.challenge) {
		return `/exercises/${action.challenge.track.slug}/${action.challenge.slug}`;
	}
	return action.targetType === 'MENTORSHIP' ? '/mentorship' : '/';
}

export function RemediationActions() {
	const t = useTranslations('remediation');
	const locale = useLocale();
	const utils = api.useUtils();
	const { data: actions, isLoading } = api.remediation.getMine.useQuery();
	const [evidence, setEvidence] = useState<Record<string, string>>({});
	const startMutation = api.remediation.start.useMutation({
		onSuccess: () => void utils.remediation.getMine.invalidate(),
		onError: (error) => toast.error(error.message)
	});
	const submitMutation = api.remediation.submit.useMutation({
		onSuccess: async (_, input) => {
			setEvidence((current) => ({ ...current, [input.actionId]: '' }));
			toast.success(t('submitted'));
			await utils.remediation.getMine.invalidate();
		},
		onError: (error) => toast.error(error.message)
	});

	if (isLoading || !actions || actions.length === 0) return null;

	return (
		<section aria-labelledby="remediation-actions-title" className="space-y-3">
			<div>
				<h2 id="remediation-actions-title" className="font-semibold text-base">
					{t('title')}
				</h2>
				<p className="mt-1 text-muted-foreground text-sm">{t('description')}</p>
			</div>
			<div className="space-y-3">
				{actions.map((action) => {
					const isActive =
						action.status === 'OPEN' || action.status === 'IN_PROGRESS';
					const isPendingReview = action.status === 'SUBMITTED';
					const isCompleted = action.status === 'COMPLETED';
					return (
						<Card key={action.id} className="shadow-none">
							<CardHeader className="pb-3">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<CardTitle level={3} className="text-base">
										{action.title}
									</CardTitle>
									<Badge
										variant={
											isCompleted
												? 'success'
												: isPendingReview
													? 'warning'
													: 'outline'
										}
									>
										{t(`status.${action.status}`)}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-start gap-2 text-sm">
									{isCompleted ? (
										<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
									) : (
										<CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
									)}
									<p className="whitespace-pre-wrap">{action.description}</p>
								</div>
								{action.dueAt && (
									<p className="text-muted-foreground text-xs">
										{t('due', {
											date: new Date(action.dueAt).toLocaleDateString(locale)
										})}
									</p>
								)}
								{isActive && (
									<div className="space-y-2">
										<Textarea
											value={evidence[action.id] ?? ''}
											maxLength={2000}
											placeholder={t('evidencePlaceholder')}
											onChange={(event) =>
												setEvidence((current) => ({
													...current,
													[action.id]: event.target.value
												}))
											}
										/>
										<div className="flex flex-wrap gap-2">
											{action.status === 'OPEN' && (
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														startMutation.mutate({ actionId: action.id })
													}
													disabled={startMutation.isPending}
												>
													{t('start')}
												</Button>
											)}
											<Button
												size="sm"
												onClick={() =>
													submitMutation.mutate({
														actionId: action.id,
														evidenceNote: evidence[action.id]?.trim() ?? ''
													})
												}
												disabled={
													submitMutation.isPending ||
													!evidence[action.id]?.trim()
												}
											>
												{submitMutation.isPending ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : null}
												{t('submit')}
											</Button>
										</div>
									</div>
								)}
								{isPendingReview && (
									<p className="text-muted-foreground text-sm">
										{t('awaitingReview')}
									</p>
								)}
								{!isCompleted && (
									<Button asChild variant="ghost" size="sm" className="px-0">
										<Link href={getActionHref(action)}>
											{t('openTarget')}
											<ArrowRight className="ml-2 h-4 w-4" />
										</Link>
									</Button>
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>
		</section>
	);
}
