'use client';

import {
	ArrowDown,
	ArrowUp,
	Check,
	CircleDot,
	ExternalLink,
	Plus
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Input } from '~/common/components/ui/input';
import { Textarea } from '~/common/components/ui/textarea';
import { api } from '~/trpc/react';

type LearningPlanProps = { learnerId?: string };
type PlanStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
type TargetType =
	| 'TASK'
	| 'EXERCISE'
	| 'REMEDIATION'
	| 'MENTORSHIP'
	| 'COHORT_EVENT'
	| 'CUSTOM';

function targetKey(type: TargetType, id: string | null) {
	return `${type}:${id ?? ''}`;
}

export function LearningPlan({ learnerId }: LearningPlanProps) {
	const t = useTranslations('learningPlan');
	const utils = api.useUtils();
	const scope = learnerId ? { learnerId } : undefined;
	const planQuery = api.learningPlan.get.useQuery(scope);
	const candidatesQuery = api.learningPlan.getCandidates.useQuery(scope);
	const plan = planQuery.data;
	const candidates = candidatesQuery.data;
	const [planTitle, setPlanTitle] = useState('');
	const [objective, setObjective] = useState('');
	const [selectedTarget, setSelectedTarget] = useState('CUSTOM:');
	const [actionTitle, setActionTitle] = useState('');
	const [reason, setReason] = useState('');
	const [dueDate, setDueDate] = useState('');
	const [dependencyIds, setDependencyIds] = useState<string[]>([]);
	const savedPlanId = plan?.id;
	const savedPlanTitle = plan?.title;
	const savedObjective = plan?.objective;

	useEffect(() => {
		if (!savedPlanId) return;
		setPlanTitle(savedPlanTitle ?? '');
		setObjective(savedObjective ?? '');
	}, [savedObjective, savedPlanId, savedPlanTitle]);

	const invalidatePlan = async () => {
		await Promise.all([
			utils.learningPlan.get.invalidate(scope),
			utils.learningPlan.getCandidates.invalidate(scope)
		]);
	};
	const savePlan = api.learningPlan.save.useMutation({
		onSuccess: async () => {
			toast.success(t('saved'));
			await invalidatePlan();
		},
		onError: (error) => toast.error(error.message)
	});
	const addItem = api.learningPlan.addItem.useMutation({
		onSuccess: async () => {
			setSelectedTarget('CUSTOM:');
			setActionTitle('');
			setReason('');
			setDueDate('');
			setDependencyIds([]);
			toast.success(t('actionSaved'));
			await invalidatePlan();
		},
		onError: (error) => toast.error(error.message)
	});
	const updateItem = api.learningPlan.updateItem.useMutation({
		onSuccess: async () => {
			toast.success(t('statusUpdated'));
			await invalidatePlan();
		},
		onError: (error) => toast.error(error.message)
	});
	const reorderItems = api.learningPlan.reorder.useMutation({
		onSuccess: invalidatePlan,
		onError: (error) => toast.error(error.message)
	});

	const allCandidates = [
		...(candidates?.tasks ?? []),
		...(candidates?.exercises ?? []),
		...(candidates?.remediations ?? []),
		...(candidates?.cohortEvents ?? []),
		...(candidates?.mentorship ? [candidates.mentorship] : [])
	];
	const selectedCandidate = allCandidates.find(
		(candidate) => targetKey(candidate.type, candidate.id) === selectedTarget
	);
	const [selectedType, selectedId = ''] = selectedTarget.split(':');
	const targetType = selectedType as TargetType;
	const isCustom = targetType === 'CUSTOM';

	const submitPlan = () => {
		if (!planTitle.trim()) {
			toast.error(t('planTitlePlaceholder'));
			return;
		}
		savePlan.mutate({
			...(learnerId ? { learnerId } : {}),
			title: planTitle,
			objective: objective || null
		});
	};

	const submitItem = () => {
		if (!plan) return;
		if (!reason.trim()) {
			toast.error(t('reasonPlaceholder'));
			return;
		}
		if (isCustom && !actionTitle.trim()) {
			toast.error(t('actionTitlePlaceholder'));
			return;
		}
		addItem.mutate({
			...(learnerId ? { learnerId } : {}),
			targetType,
			...(selectedId ? { targetId: selectedId } : {}),
			...(actionTitle.trim() ? { title: actionTitle } : {}),
			reason,
			dueAt: dueDate ? new Date(`${dueDate}T23:59:59`) : null,
			dependencyIds
		});
	};

	const moveItem = (index: number, direction: -1 | 1) => {
		if (!plan) return;
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= plan.items.length) return;
		const itemIds = plan.items.map((item) => item.id);
		const currentId = itemIds[index];
		const nextId = itemIds[nextIndex];
		if (!currentId || !nextId) return;
		itemIds[index] = nextId;
		itemIds[nextIndex] = currentId;
		reorderItems.mutate({ ...(learnerId ? { learnerId } : {}), itemIds });
	};

	const changeStatus = (itemId: string, status: PlanStatus) => {
		updateItem.mutate({
			...(learnerId ? { learnerId } : {}),
			itemId,
			status
		});
	};

	return (
		<section aria-labelledby="learning-plan-title" className="space-y-3">
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle
						id="learning-plan-title"
						className="flex items-center gap-2"
					>
						<CircleDot className="h-5 w-5 text-primary" aria-hidden="true" />
						{t('title')}
					</CardTitle>
					<CardDescription>{t('description')}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-3 md:grid-cols-2">
						<Input
							value={planTitle}
							onChange={(event) => setPlanTitle(event.target.value)}
							placeholder={t('planTitlePlaceholder')}
							maxLength={160}
						/>
						<Textarea
							value={objective}
							onChange={(event) => setObjective(event.target.value)}
							placeholder={t('objectivePlaceholder')}
							maxLength={1000}
							rows={2}
						/>
					</div>
					<Button onClick={submitPlan} disabled={savePlan.isPending}>
						{t('savePlan')}
					</Button>
				</CardContent>
			</Card>

			{plan ? (
				<>
					<Card className="shadow-none">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between gap-3">
								<CardTitle level={3} className="text-base">
									{t('addAction')}
								</CardTitle>
								<Plus
									className="h-4 w-4 text-muted-foreground"
									aria-hidden="true"
								/>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="grid gap-3 md:grid-cols-2">
								<select
									aria-label={t('targetPlaceholder')}
									className="h-10 rounded-md border bg-background px-3 text-sm"
									value={selectedTarget}
									onChange={(event) => setSelectedTarget(event.target.value)}
								>
									<option value="CUSTOM:">{t('customTarget')}</option>
									{candidates?.tasks.length ? (
										<optgroup label={t('target.TASK')}>
											{candidates.tasks.map((candidate) => (
												<option
													key={targetKey(candidate.type, candidate.id)}
													value={targetKey(candidate.type, candidate.id)}
												>
													{candidate.title}
												</option>
											))}
										</optgroup>
									) : null}
									{candidates?.exercises.length ? (
										<optgroup label={t('target.EXERCISE')}>
											{candidates.exercises.map((candidate) => (
												<option
													key={targetKey(candidate.type, candidate.id)}
													value={targetKey(candidate.type, candidate.id)}
												>
													{candidate.title}
												</option>
											))}
										</optgroup>
									) : null}
									{candidates?.remediations.length ? (
										<optgroup label={t('target.REMEDIATION')}>
											{candidates.remediations.map((candidate) => (
												<option
													key={targetKey(candidate.type, candidate.id)}
													value={targetKey(candidate.type, candidate.id)}
												>
													{candidate.title}
												</option>
											))}
										</optgroup>
									) : null}
									{candidates?.cohortEvents.length ? (
										<optgroup label={t('target.COHORT_EVENT')}>
											{candidates.cohortEvents.map((candidate) => (
												<option
													key={targetKey(candidate.type, candidate.id)}
													value={targetKey(candidate.type, candidate.id)}
												>
													{candidate.title}
												</option>
											))}
										</optgroup>
									) : null}
									{candidates?.mentorship ? (
										<option value="MENTORSHIP:">
											{t('target.MENTORSHIP')}
										</option>
									) : null}
								</select>
								<Input
									value={actionTitle}
									onChange={(event) => setActionTitle(event.target.value)}
									placeholder={t('actionTitlePlaceholder')}
									maxLength={160}
								/>
								<Textarea
									value={reason}
									onChange={(event) => setReason(event.target.value)}
									placeholder={t('reasonPlaceholder')}
									maxLength={1000}
									rows={2}
								/>
								<Input
									type="date"
									value={dueDate}
									onChange={(event) => setDueDate(event.target.value)}
									aria-label={t('dueDate')}
								/>
							</div>
							{plan.items.length > 0 && (
								<div className="space-y-2">
									<p className="font-medium text-sm">{t('dependsOn')}</p>
									<div className="grid gap-2 sm:grid-cols-2">
										{plan.items.map((item) => (
											<label
												key={item.id}
												className="flex items-center gap-2 text-sm"
											>
												<input
													type="checkbox"
													checked={dependencyIds.includes(item.id)}
													onChange={(event) =>
														setDependencyIds((current) =>
															event.target.checked
																? [...current, item.id]
																: current.filter((id) => id !== item.id)
														)
													}
												/>
												{item.title}
											</label>
										))}
									</div>
								</div>
							)}
							{selectedCandidate?.href && (
								<p className="text-muted-foreground text-xs">
									{selectedCandidate.title}
								</p>
							)}
							<Button onClick={submitItem} disabled={addItem.isPending}>
								{t('saveAction')}
							</Button>
						</CardContent>
					</Card>

					<div className="space-y-3">
						{plan.items.map((item, index) => (
							<Card key={item.id} className="shadow-none">
								<CardContent className="space-y-3 p-4">
									<div className="flex items-start justify-between gap-3">
										<div className="flex min-w-0 items-start gap-3">
											<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-sm">
												{index + 1}
											</div>
											<div className="min-w-0">
												<p className="font-medium">{item.title}</p>
												<p className="mt-1 whitespace-pre-wrap text-muted-foreground text-sm">
													{item.reason}
												</p>
											</div>
										</div>
										<Badge
											variant={
												item.status === 'COMPLETED' ? 'success' : 'outline'
											}
										>
											{t(`status.${item.status}`)}
										</Badge>
									</div>
									<div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
										<span>{t(`target.${item.targetType}`)}</span>
										{item.dueAt && (
											<span>· {new Date(item.dueAt).toLocaleDateString()}</span>
										)}
										{item.dependencies.length > 0 && (
											<span>
												· {t('dependsOn')}:{' '}
												{item.dependencies
													.map((dependency) => dependency.prerequisite.title)
													.join(', ')}
											</span>
										)}
									</div>
									<div className="flex flex-wrap gap-2">
										{item.targetHref && (
											<Button
												asChild
												variant="ghost"
												size="sm"
												className="px-0"
											>
												<Link href={item.targetHref}>
													{t('open')}
													<ExternalLink className="ml-1 h-3.5 w-3.5" />
												</Link>
											</Button>
										)}
										{item.status === 'PLANNED' && (
											<Button
												size="sm"
												onClick={() => changeStatus(item.id, 'IN_PROGRESS')}
											>
												{t('start')}
											</Button>
										)}
										{item.status === 'IN_PROGRESS' && (
											<Button
												size="sm"
												onClick={() => changeStatus(item.id, 'COMPLETED')}
											>
												<Check className="mr-1 h-3.5 w-3.5" />
												{t('complete')}
											</Button>
										)}
										{(item.status === 'PLANNED' ||
											item.status === 'IN_PROGRESS') && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => changeStatus(item.id, 'SKIPPED')}
											>
												{t('skip')}
											</Button>
										)}
										{(item.status === 'COMPLETED' ||
											item.status === 'SKIPPED') && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => changeStatus(item.id, 'PLANNED')}
											>
												{t('reopen')}
											</Button>
										)}
										<Button
											variant="ghost"
											size="sm"
											disabled={index === 0 || reorderItems.isPending}
											onClick={() => moveItem(index, -1)}
											aria-label={t('moveUp')}
										>
											<ArrowUp className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											disabled={
												index === plan.items.length - 1 ||
												reorderItems.isPending
											}
											onClick={() => moveItem(index, 1)}
											aria-label={t('moveDown')}
										>
											<ArrowDown className="h-4 w-4" />
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</>
			) : (
				<p className="text-muted-foreground text-sm">
					{t('createDescription')}
				</p>
			)}
		</section>
	);
}
