'use client';

import type { ProductVersionStatusEnum } from '@prisma/client';
import {
	ArrowDown,
	ArrowUp,
	Check,
	Circle,
	CircleSlash,
	Pencil,
	Play,
	RotateCcw,
	Trash2,
	X
} from 'lucide-react';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent, CardHeader } from '~/common/components/ui/card';
import { Progress } from '~/common/components/ui/progress';
import { cn } from '~/lib/utils';
import type { RouterOutputs } from '~/trpc/react';
import StoryRow from './StoryRow';

type ProductVersion =
	RouterOutputs['productVersion']['getAll']['versions'][number];
export type { ProductVersion };

type VersionStatus = ProductVersionStatusEnum | null;

export const statusLabel: Record<ProductVersionStatusEnum, string> = {
	PLANNED: 'Planned',
	IN_PROGRESS: 'In progress',
	COMPLETED: 'Completed',
	CANCELED: 'Canceled'
};

const statusIcon = (status: VersionStatus) => {
	if (status === 'COMPLETED') return <Check className="h-3.5 w-3.5" />;
	if (status === 'CANCELED') return <CircleSlash className="h-3.5 w-3.5" />;
	if (status === 'IN_PROGRESS') return <Play className="h-3.5 w-3.5" />;
	return <Circle className="h-3.5 w-3.5" />;
};

export const countCompletedStories = (stories: ProductVersion['tasks']) =>
	stories.filter((story) => story.status === 'DONE').length;

const progressFor = (stories: ProductVersion['tasks']) => {
	if (stories.length === 0) return 0;
	return Math.round((countCompletedStories(stories) / stories.length) * 100);
};

interface ProductVersionCardProps {
	version: ProductVersion;
	versions: ProductVersion[];
	index: number;
	versionCount: number;
	canManageVersions: boolean;
	readOnly: boolean;
	onMoveVersion: (index: number, direction: -1 | 1) => void;
	onMoveStory: (
		version: ProductVersion,
		index: number,
		direction: -1 | 1
	) => void;
	onAssignStory: (
		storyId: string,
		versionId: string | null,
		order: number
	) => void;
	onEdit: (version: ProductVersion) => void;
	onDelete: () => void;
	onStart: () => void;
	onComplete: () => void;
	onCancel: () => void;
	onReopen: () => void;
}

export default function ProductVersionCard({
	version,
	versions,
	index,
	versionCount,
	canManageVersions,
	readOnly,
	onMoveVersion,
	onMoveStory,
	onAssignStory,
	onEdit,
	onDelete,
	onStart,
	onComplete,
	onCancel,
	onReopen
}: ProductVersionCardProps) {
	const progress = progressFor(version.tasks);
	const completedStories = countCompletedStories(version.tasks);
	const status = version.status;
	const canEdit = canManageVersions && !readOnly;
	const statusBadgeVariant =
		status === 'COMPLETED'
			? 'success'
			: status === 'IN_PROGRESS'
				? 'warning'
				: status === 'CANCELED'
					? 'destructive'
					: 'outline';
	const statusAccent =
		status === 'COMPLETED'
			? 'bg-success'
			: status === 'IN_PROGRESS'
				? 'bg-warning'
				: status === 'CANCELED'
					? 'bg-destructive'
					: 'bg-primary';
	const canMoveStories = !readOnly;

	return (
		<Card className="overflow-hidden">
			<div className={cn('h-1', statusAccent)} />
			<CardHeader className="space-y-4 p-5 sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="flex min-w-0 items-start gap-3">
						<div className="flex shrink-0 flex-col items-center gap-1">
							<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-semibold text-muted-foreground text-sm tabular-nums">
								{index + 1}
							</span>
							<div className="flex gap-0.5">
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									disabled={!canEdit || index === 0}
									onClick={() => onMoveVersion(index, -1)}
									aria-label={`Move ${version.name} up`}
								>
									<ArrowUp className="h-3.5 w-3.5" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									disabled={!canEdit || index === versionCount - 1}
									onClick={() => onMoveVersion(index, 1)}
									aria-label={`Move ${version.name} down`}
								>
									<ArrowDown className="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<h3 className="font-semibold text-lg tracking-tight">
									{version.name}
								</h3>
								{status && (
									<Badge variant={statusBadgeVariant}>
										{statusIcon(status)}
										<span className="ml-1">{statusLabel[status]}</span>
									</Badge>
								)}
							</div>
							{version.description && (
								<p className="mt-1 max-w-2xl text-muted-foreground text-sm">
									{version.description}
								</p>
							)}
						</div>
					</div>
					{canEdit && (
						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => onEdit(version)}
								aria-label={`Edit ${version.name}`}
							>
								<Pencil className="h-4 w-4" />
							</Button>
							<ConfirmationDialog
								title="Delete product version"
								description={`Delete "${version.name}"? Move its User Stories first.`}
								onConfirm={onDelete}
							>
								<Button
									variant="ghost"
									size="icon"
									className="text-destructive hover:text-destructive"
									aria-label={`Delete ${version.name}`}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</ConfirmationDialog>
						</div>
					)}
				</div>

				<div className="space-y-2 rounded-lg bg-muted/40 p-3">
					<div className="flex items-center justify-between gap-3 text-sm">
						<span className="font-medium">Progress</span>
						<span className="text-muted-foreground tabular-nums">
							{completedStories} of {version.tasks.length} stories complete ·{' '}
							{progress}%
						</span>
					</div>
					<Progress value={progress} className="h-2" />
				</div>

				{status && (
					<div className="flex flex-wrap gap-2">
						{status === 'PLANNED' && (
							<Button
								size="sm"
								variant="outline"
								onClick={onStart}
								disabled={readOnly}
							>
								<Play className="mr-1.5 h-3.5 w-3.5" /> Start version
							</Button>
						)}
						{status === 'IN_PROGRESS' && canManageVersions && (
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									if (version.tasks.some((story) => story.status !== 'DONE')) {
										if (
											!window.confirm(
												'This version has open User Stories. Complete it anyway?'
											)
										)
											return;
									}
									onComplete();
								}}
								disabled={readOnly}
							>
								<Check className="mr-1.5 h-3.5 w-3.5" /> Complete version
							</Button>
						)}
						{(status === 'PLANNED' || status === 'IN_PROGRESS') &&
							canManageVersions && (
								<Button
									size="sm"
									variant="ghost"
									onClick={onCancel}
									disabled={readOnly}
								>
									<X className="mr-1.5 h-3.5 w-3.5" /> Cancel
								</Button>
							)}
						{(status === 'COMPLETED' || status === 'CANCELED') &&
							canManageVersions && (
								<Button
									size="sm"
									variant="outline"
									onClick={onReopen}
									disabled={readOnly}
								>
									<RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reopen
								</Button>
							)}
					</div>
				)}
			</CardHeader>
			<CardContent className="space-y-2 border-t bg-background/50 p-4 sm:p-6">
				<div className="flex items-center justify-between gap-3 pb-1">
					<p className="font-medium text-sm">User Stories</p>
					<span className="text-muted-foreground text-xs">
						{version.tasks.length} assigned
					</span>
				</div>
				{version.tasks.map((story, storyIndex) => (
					<StoryRow
						key={story.id}
						story={story}
						versions={versions}
						readOnly={!canMoveStories}
						onAssign={(versionId) =>
							onAssignStory(
								story.id,
								versionId,
								versions.find((candidate) => candidate.id === versionId)?.tasks
									.length ?? 0
							)
						}
						onMoveUp={() => onMoveStory(version, storyIndex, -1)}
						onMoveDown={() => onMoveStory(version, storyIndex, 1)}
						canMove={canMoveStories}
					/>
				))}
				{version.tasks.length === 0 && (
					<p className="rounded-lg border border-dashed p-4 text-center text-muted-foreground text-sm">
						No User Stories in this version yet.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
