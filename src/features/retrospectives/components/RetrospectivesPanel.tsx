'use client';

import { RetrospectiveCategoryEnum, SprintStatusEnum } from '@prisma/client';
import { Check, Circle, ListChecks, Plus, Trash2 } from 'lucide-react';
import {
	type FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useState
} from 'react';
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Input } from '~/common/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { usePusherPresence } from '~/common/hooks/usePusherPresence';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';

const retrospectiveEvents = [
	'retrospective-created',
	'retrospective-item-added',
	'retrospective-item-toggled',
	'retrospective-item-deleted'
] as const;

const categories = [
	{
		id: RetrospectiveCategoryEnum.WENT_WELL,
		label: 'What went well',
		description: 'Keep the practices that helped the team.',
		color: 'border-success-border bg-success-muted/30'
	},
	{
		id: RetrospectiveCategoryEnum.IMPROVE,
		label: 'What to improve',
		description: 'Name friction without assigning blame.',
		color: 'border-warning-border bg-warning-muted/30'
	},
	{
		id: RetrospectiveCategoryEnum.ACTION,
		label: 'Action items',
		description: 'Turn learning into a concrete next step.',
		color: 'border-info-border bg-info-muted/30'
	}
] as const;

type Sprint = {
	id: string;
	title: string;
	status: SprintStatusEnum;
	startDate: Date | null;
	endDate: Date | null;
};

interface RetrospectivesPanelProps {
	projectId: string;
	sprints: Sprint[];
	canManageRetrospectives: boolean;
}

const formatDateRange = (startDate: Date | null, endDate: Date | null) => {
	if (!startDate && !endDate) return 'Dates not set';
	const format = (value: Date) =>
		new Intl.DateTimeFormat(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(value));
	return `${startDate ? format(startDate) : 'Unknown'} – ${endDate ? format(endDate) : 'Unknown'}`;
};

export default function RetrospectivesPanel({
	projectId,
	sprints,
	canManageRetrospectives
}: RetrospectivesPanelProps) {
	const utils = api.useUtils();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [sprintToRetrospect, setSprintToRetrospect] = useState('');
	const [drafts, setDrafts] = useState<Record<string, string>>({});
	const { data: retrospectives, isLoading } =
		api.retrospective.getByProjectId.useQuery({ projectId });

	const completedSprints = useMemo(
		() =>
			sprints.filter((sprint) => sprint.status === SprintStatusEnum.COMPLETED),
		[sprints]
	);
	const availableSprints = useMemo(() => {
		const existingSprintIds = new Set(
			(retrospectives ?? []).map((retrospective) => retrospective.sprint.id)
		);
		return completedSprints.filter(
			(sprint) => !existingSprintIds.has(sprint.id)
		);
	}, [completedSprints, retrospectives]);
	const selectedRetrospective = (retrospectives ?? []).find(
		(retrospective) => retrospective.id === selectedId
	);

	useEffect(() => {
		if (selectedId && retrospectives?.some((item) => item.id === selectedId)) {
			return;
		}
		setSelectedId(retrospectives?.[0]?.id ?? null);
	}, [retrospectives, selectedId]);

	const invalidateRetrospectives = useCallback(
		() => utils.retrospective.getByProjectId.invalidate({ projectId }),
		[projectId, utils]
	);
	const handleRealtimeEvent = useCallback(
		(event: { type: string; data: unknown }) => {
			const data = event.data as { projectId?: string };
			if (!data.projectId || data.projectId === projectId) {
				void invalidateRetrospectives();
			}
		},
		[invalidateRetrospectives, projectId]
	);
	const { status: realtimeStatus } = usePusherPresence({
		channelName: `presence-retrospective-project-${projectId}`,
		eventNames: retrospectiveEvents,
		callbacks: { onEvent: handleRealtimeEvent }
	});

	const createRetrospective = api.retrospective.create.useMutation({
		onSuccess: async (retrospective) => {
			await invalidateRetrospectives();
			setSelectedId(retrospective.id);
			setSprintToRetrospect('');
			setIsCreateOpen(false);
		},
		onError: (error) => toast.error(error.message)
	});
	const addItem = api.retrospective.addItem.useMutation({
		onSuccess: (_item, variables) => {
			setDrafts((current) => ({ ...current, [variables.category]: '' }));
			void invalidateRetrospectives();
		},
		onError: (error) => toast.error(error.message)
	});
	const toggleItem = api.retrospective.toggleItem.useMutation({
		onSettled: () => void invalidateRetrospectives(),
		onError: (error) => toast.error(error.message)
	});
	const deleteItem = api.retrospective.deleteItem.useMutation({
		onSuccess: () => void invalidateRetrospectives(),
		onError: (error) => toast.error(error.message)
	});

	const handleCreate = () => {
		if (!sprintToRetrospect) return;
		createRetrospective.mutate({
			projectId,
			sprintId: sprintToRetrospect
		});
	};

	const handleAddItem = (
		event: FormEvent<HTMLFormElement>,
		category: RetrospectiveCategoryEnum
	) => {
		event.preventDefault();
		if (!selectedRetrospective || !drafts[category]?.trim()) return;
		addItem.mutate({
			retrospectiveId: selectedRetrospective.id,
			category,
			content: drafts[category]
		});
	};

	if (isLoading) {
		return (
			<div className="p-8 text-center text-muted-foreground">
				Loading retrospectives...
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto p-6">
			<div className="mx-auto max-w-6xl space-y-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<div className="flex items-center gap-2">
							<ListChecks className="h-5 w-5 text-info" />
							<h2 className="font-semibold text-xl">Sprint retrospectives</h2>
						</div>
						<div className="mt-1 flex flex-wrap items-center gap-2">
							<p className="text-muted-foreground text-sm">
								Reflect together, then carry the useful changes into the next
								sprint.
							</p>
							<Badge
								variant={
									realtimeStatus === 'connected' ? 'success' : 'secondary'
								}
								aria-live="polite"
							>
								{realtimeStatus === 'connected'
									? 'Live updates'
									: 'Connecting...'}
							</Badge>
						</div>
					</div>
					{canManageRetrospectives && (
						<Button
							className="gap-2"
							onClick={() => setIsCreateOpen(true)}
							disabled={availableSprints.length === 0}
						>
							<Plus className="h-4 w-4" />
							Start retrospective
						</Button>
					)}
				</div>

				{retrospectives && retrospectives.length > 0 ? (
					<>
						<div className="flex flex-wrap gap-2">
							{retrospectives.map((retrospective) => (
								<Button
									key={retrospective.id}
									variant={
										selectedId === retrospective.id ? 'secondary' : 'outline'
									}
									onClick={() => setSelectedId(retrospective.id)}
								>
									{retrospective.sprint.title}
								</Button>
							))}
						</div>
						{selectedRetrospective && (
							<Card>
								<CardHeader>
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<CardTitle>
												{selectedRetrospective.sprint.title}
											</CardTitle>
											<CardDescription>
												{formatDateRange(
													selectedRetrospective.sprint.startDate,
													selectedRetrospective.sprint.endDate
												)}
											</CardDescription>
										</div>
										<Badge variant="secondary">
											{selectedRetrospective.items.length} notes
										</Badge>
									</div>
								</CardHeader>
								<CardContent className="grid gap-4 lg:grid-cols-3">
									{categories.map((category) => {
										const items = selectedRetrospective.items.filter(
											(item) => item.category === category.id
										);
										return (
											<Card
												key={category.id}
												className={cn('border', category.color)}
											>
												<CardHeader className="pb-3">
													<CardTitle className="text-base">
														{category.label}
													</CardTitle>
													<CardDescription>
														{category.description}
													</CardDescription>
												</CardHeader>
												<CardContent className="space-y-3">
													{items.map((item) => (
														<div
															key={item.id}
															className="group flex items-start gap-2 rounded-md border bg-background/80 p-3"
														>
															{category.id ===
															RetrospectiveCategoryEnum.ACTION ? (
																<button
																	type="button"
																	className="mt-0.5 shrink-0 text-muted-foreground"
																	aria-label={`${item.completed ? 'Reopen' : 'Complete'} action: ${item.content}`}
																	onClick={() =>
																		toggleItem.mutate({
																			itemId: item.id,
																			completed: !item.completed
																		})
																	}
																>
																	{item.completed ? (
																		<Check className="h-4 w-4 text-success" />
																	) : (
																		<Circle className="h-4 w-4" />
																	)}
																</button>
															) : null}
															<p
																className={cn(
																	'flex-1 whitespace-pre-wrap text-sm',
																	item.completed &&
																		'text-muted-foreground line-through'
																)}
															>
																{item.content}
															</p>
															<Button
																variant="ghost"
																size="icon"
																className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
																aria-label={`Delete note: ${item.content}`}
																onClick={() =>
																	deleteItem.mutate({ itemId: item.id })
																}
															>
																<Trash2 className="h-3.5 w-3.5 text-destructive" />
															</Button>
														</div>
													))}
													<form
														className="space-y-2"
														onSubmit={(event) =>
															handleAddItem(event, category.id)
														}
													>
														<Input
															value={drafts[category.id] ?? ''}
															onChange={(event) =>
																setDrafts((current) => ({
																	...current,
																	[category.id]: event.target.value
																}))
															}
															placeholder={`Add ${category.label.toLowerCase()}`}
															maxLength={1000}
														/>
														<Button
															type="submit"
															variant="outline"
															size="sm"
															className="w-full"
															disabled={
																addItem.isPending ||
																!drafts[category.id]?.trim()
															}
														>
															Add note
														</Button>
													</form>
												</CardContent>
											</Card>
										);
									})}
								</CardContent>
							</Card>
						)}
					</>
				) : (
					<Card>
						<CardContent className="flex flex-col items-center gap-3 py-12 text-center">
							<ListChecks className="h-10 w-10 text-muted-foreground" />
							<h3 className="font-semibold">No retrospectives yet</h3>
							<p className="max-w-md text-muted-foreground text-sm">
								Complete a sprint, then start a retrospective to capture what
								the team learned.
							</p>
						</CardContent>
					</Card>
				)}
			</div>

			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Start a retrospective</DialogTitle>
						<DialogDescription>
							Choose the completed sprint the team is reflecting on.
						</DialogDescription>
					</DialogHeader>
					<Select
						value={sprintToRetrospect}
						onValueChange={setSprintToRetrospect}
					>
						<SelectTrigger aria-label="Sprint to retrospect">
							<SelectValue placeholder="Choose a sprint" />
						</SelectTrigger>
						<SelectContent>
							{availableSprints.map((sprint) => (
								<SelectItem key={sprint.id} value={sprint.id}>
									{sprint.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<DialogFooter>
						<Button
							onClick={handleCreate}
							disabled={!sprintToRetrospect || createRetrospective.isPending}
						>
							{createRetrospective.isPending
								? 'Starting...'
								: 'Start retrospective'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
