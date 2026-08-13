'use client';

import { Protect } from '@clerk/nextjs';
import {
	AlertTriangle,
	ArrowDown,
	ArrowUp,
	CheckCircle2,
	Clock3,
	Milestone as MilestoneIcon
} from 'lucide-react';
import Link from 'next/link';
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
import { Progress } from '~/common/components/ui/progress';
import { Skeleton } from '~/common/components/ui/skeleton';
import { api, type RouterOutputs } from '~/trpc/react';

type Roadmap = RouterOutputs['project']['getRoadmap'];
type RoadmapMilestone = Roadmap['milestones'][number];

function MilestoneCard({
	milestone,
	projectId,
	index,
	count,
	onMove,
	onReview,
	isReordering,
	isReviewing
}: {
	milestone: RoadmapMilestone;
	projectId: string;
	index: number;
	count: number;
	onMove: (direction: -1 | 1) => void;
	onReview: () => void;
	isReordering: boolean;
	isReviewing: boolean;
}) {
	const complete = milestone.taskCount > 0 && milestone.progress === 100;

	return (
		<Card className={milestone.blockedTaskCount ? 'border-warning/50' : ''}>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-4">
					<div className="flex min-w-0 items-start gap-3">
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm">
							{index + 1}
						</div>
						<div className="min-w-0">
							<CardTitle level={2} className="text-lg">
								{milestone.title}
							</CardTitle>
							{milestone.description && (
								<CardDescription className="mt-1">
									{milestone.description}
								</CardDescription>
							)}
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-1">
						<Badge variant={complete ? 'success' : 'outline'}>
							{complete ? 'Complete' : `${milestone.progress}%`}
						</Badge>
						{milestone.reviewedAt && (
							<Badge variant="secondary">Reviewed</Badge>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
					<span>
						{milestone.doneCount} of {milestone.taskCount} tasks complete
					</span>
					{milestone.blockedTaskCount > 0 && (
						<span className="font-medium text-warning">
							<AlertTriangle className="mr-1 inline h-4 w-4" />
							{milestone.blockedTaskCount} blocked
						</span>
					)}
				</div>
				<Progress value={milestone.progress} className="h-2" />

				{(milestone.sprints.length > 0 || milestone.epics.length > 0) && (
					<div className="flex flex-wrap gap-2">
						{milestone.sprints.map((sprint) => (
							<Badge key={sprint.id} variant="secondary">
								Sprint: {sprint.title}
							</Badge>
						))}
						{milestone.epics.map((epic) => (
							<Badge key={epic.id} variant="secondary">
								Epic: {epic.title}
							</Badge>
						))}
					</div>
				)}

				{milestone.tasks.length > 0 && (
					<div className="space-y-1">
						<p className="font-medium text-sm">Tasks</p>
						<div className="grid gap-1 sm:grid-cols-2">
							{milestone.tasks.slice(0, 8).map((task) => (
								<Link
									key={task.id}
									href={`/workspace/${projectId}?taskId=${task.id}`}
									className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted"
								>
									{task.status === 'DONE' ? (
										<CheckCircle2 className="h-4 w-4 text-success" />
									) : (
										<Clock3 className="h-4 w-4 text-muted-foreground" />
									)}
									<span className="truncate">{task.title}</span>
								</Link>
							))}
						</div>
						{milestone.tasks.length > 8 && (
							<p className="text-muted-foreground text-xs">
								Showing 8 of {milestone.tasks.length} tasks
							</p>
						)}
					</div>
				)}

				<div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
					{/* biome-ignore lint/a11y/useValidAriaRole: Clerk Protect uses role for org authorization */}
					<Protect role="org:admin">
						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								size="icon"
								aria-label="Move milestone up"
								disabled={index === 0 || isReordering}
								onClick={() => onMove(-1)}
							>
								<ArrowUp className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								aria-label="Move milestone down"
								disabled={index === count - 1 || isReordering}
								onClick={() => onMove(1)}
							>
								<ArrowDown className="h-4 w-4" />
							</Button>
						</div>
					</Protect>
					{/* biome-ignore lint/a11y/useValidAriaRole: Clerk Protect uses role for org authorization */}
					<Protect role="org:admin">
						<Button
							variant={milestone.reviewedAt ? 'outline' : 'secondary'}
							size="sm"
							disabled={isReviewing}
							onClick={onReview}
						>
							{isReviewing
								? 'Saving...'
								: milestone.reviewedAt
									? 'Unmark reviewed'
									: 'Mark reviewed'}
						</Button>
					</Protect>
				</div>
			</CardContent>
		</Card>
	);
}

export default function ProjectRoadmap({ projectId }: { projectId: string }) {
	const utils = api.useUtils();
	const roadmap = api.project.getRoadmap.useQuery({ projectId });
	const reorder = api.project.reorderMilestones.useMutation({
		onSuccess: async () => {
			await utils.project.getRoadmap.invalidate({ projectId });
		},
		onError: (error) => toast.error(error.message)
	});
	const review = api.project.markMilestoneReviewed.useMutation({
		onSuccess: async () => {
			await utils.project.getRoadmap.invalidate({ projectId });
		},
		onError: (error) => toast.error(error.message)
	});

	if (roadmap.isLoading) {
		return (
			<div className="space-y-4 p-6">
				<Skeleton className="h-10 w-64" />
				<Skeleton className="h-40" />
				<Skeleton className="h-40" />
			</div>
		);
	}

	if (roadmap.isError) {
		return (
			<div className="p-6">
				<Card>
					<CardContent className="p-6 text-destructive">
						Unable to load the project roadmap. Refresh and try again.
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!roadmap.data || roadmap.data.milestones.length === 0) {
		return (
			<div className="h-full overflow-y-auto p-6">
				<Card>
					<CardContent className="flex flex-col items-center gap-3 p-10 text-center">
						<MilestoneIcon className="h-10 w-10 text-muted-foreground" />
						<div>
							<h2 className="font-semibold text-lg">No roadmap yet</h2>
							<p className="mt-1 text-muted-foreground text-sm">
								This project does not have milestones defined.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const milestones = roadmap.data.milestones;
	return (
		<div className="h-full overflow-y-auto p-6">
			<div className="mx-auto max-w-4xl space-y-4">
				<div>
					<h2 className="font-semibold text-2xl">Roadmap</h2>
					<p className="text-muted-foreground text-sm">
						Follow the milestones and expected outcomes for {roadmap.data.title}
						.
					</p>
				</div>

				<div className="space-y-4">
					{milestones.map((milestone, index) => (
						<MilestoneCard
							key={milestone.id}
							milestone={milestone}
							projectId={projectId}
							index={index}
							count={milestones.length}
							onMove={(direction) => {
								const targetIndex = index + direction;
								if (targetIndex < 0 || targetIndex >= milestones.length) return;
								const reordered = [...milestones];
								const [moved] = reordered.splice(index, 1);
								if (!moved) return;
								reordered.splice(targetIndex, 0, moved);
								reorder.mutate({
									projectId,
									items: reordered.map((item, itemIndex) => ({
										id: item.id,
										order: itemIndex
									}))
								});
							}}
							onReview={() =>
								review.mutate({
									milestoneId: milestone.id,
									reviewed: !milestone.reviewedAt
								})
							}
							isReordering={reorder.isPending}
							isReviewing={review.isPending}
						/>
					))}
				</div>

				{roadmap.data.learningOutcomes.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle level={2}>Expected outcomes</CardTitle>
							<CardDescription>
								What you should be able to demonstrate when the project is
								complete.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2 text-sm">
								{roadmap.data.learningOutcomes.map((outcome) => (
									<li key={outcome.id} className="flex items-start gap-2">
										<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
										<span>{outcome.value}</span>
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
