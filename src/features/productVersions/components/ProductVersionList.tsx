'use client';

import type { ProductVersionStatusEnum, TaskStatusEnum } from '@prisma/client';
import {
	ArrowDown,
	ArrowUp,
	Check,
	Circle,
	CircleSlash,
	Pencil,
	Play,
	Plus,
	RotateCcw,
	Trash2,
	X
} from 'lucide-react';
import { useState } from 'react';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent, CardHeader } from '~/common/components/ui/card';
import { Dialog } from '~/common/components/ui/dialog';
import { Input } from '~/common/components/ui/input';
import { Progress } from '~/common/components/ui/progress';
import { Separator } from '~/common/components/ui/separator';
import { type RouterOutputs, api } from '~/trpc/react';
import ProductVersionDialog from './ProductVersionDialog';

type Story = {
	id: string;
	title: string;
	status: TaskStatusEnum | null;
	publicNumber: number | null;
	productVersionOrder: number;
	order: number | null;
};
type ProductVersion = {
	id: string;
	name: string;
	description: string | null;
	order: number;
	status: ProductVersionStatusEnum | null;
	tasks: Story[];
};
type VersionData = RouterOutputs['productVersion']['getAll'];

type VersionStatus = ProductVersionStatusEnum | null;

interface ProductVersionListProps {
	projectId: string;
	isTemplate?: boolean;
	canManageVersions?: boolean;
	readOnly?: boolean;
}

const statusLabel: Record<ProductVersionStatusEnum, string> = {
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

const progressFor = (stories: ProductVersion['tasks']) => {
	if (stories.length === 0) return 0;
	return Math.round(
		(stories.filter((story) => story.status === 'DONE').length /
			stories.length) *
			100
	);
};

export default function ProductVersionList({
	projectId,
	isTemplate = false,
	canManageVersions = true,
	readOnly = false
}: ProductVersionListProps) {
	const [editingVersion, setEditingVersion] = useState<ProductVersion | null>(
		null
	);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [search, setSearch] = useState('');
	const { data, isLoading } = api.productVersion.getAll.useQuery({
		projectId,
		isTemplate
	});
	const utils = api.useUtils();
	const invalidate = () =>
		utils.productVersion.getAll.invalidate({ projectId, isTemplate });
	const reorderVersions = api.productVersion.reorder.useMutation({
		onSuccess: invalidate
	});
	const updateAssignments =
		api.productVersion.updateStoryAssignments.useMutation({
			onSuccess: invalidate
		});
	const deleteVersion = api.productVersion.delete.useMutation({
		onSuccess: invalidate
	});
	const startVersion = api.productVersion.start.useMutation({
		onSuccess: invalidate
	});
	const completeVersion = api.productVersion.complete.useMutation({
		onSuccess: invalidate
	});
	const cancelVersion = api.productVersion.cancel.useMutation({
		onSuccess: invalidate
	});
	const reopenVersion = api.productVersion.reopen.useMutation({
		onSuccess: invalidate
	});

	if (isLoading || !data) {
		return (
			<div className="p-8 text-center text-muted-foreground">
				Loading versions...
			</div>
		);
	}

	const versionData: VersionData = data;
	const visibleStories = versionData.unassignedStories.filter((story) =>
		story.title.toLowerCase().includes(search.trim().toLowerCase())
	);

	const moveVersion = (index: number, direction: -1 | 1) => {
		if (!canManageVersions || readOnly) return;
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= versionData.versions.length) return;
		const nextOrder = versionData.versions.map((version, versionIndex) => {
			if (versionIndex === index) return { id: version.id, order: nextIndex };
			if (versionIndex === nextIndex) return { id: version.id, order: index };
			return { id: version.id, order: versionIndex };
		});
		reorderVersions.mutate({ projectId, isTemplate, items: nextOrder });
	};

	const assignStory = (
		storyId: string,
		versionId: string | null,
		order: number
	) => {
		if (readOnly) return;
		updateAssignments.mutate({
			projectId,
			isTemplate,
			updates: [{ taskId: storyId, versionId, order }]
		});
	};

	const moveStory = (
		version: ProductVersion,
		index: number,
		direction: -1 | 1
	) => {
		if (readOnly) return;
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= version.tasks.length) return;
		const current = version.tasks[index];
		const next = version.tasks[nextIndex];
		if (!current || !next) return;
		updateAssignments.mutate({
			projectId,
			isTemplate,
			updates: [
				{ taskId: current.id, versionId: version.id, order: nextIndex },
				{ taskId: next.id, versionId: version.id, order: index }
			]
		});
	};

	const openCreateDialog = () => {
		setEditingVersion(null);
		setDialogOpen(true);
	};

	const openEditDialog = (version: ProductVersion) => {
		setEditingVersion(version);
		setDialogOpen(true);
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="font-semibold text-2xl">Product versions</h2>
					<p className="text-muted-foreground text-sm">
						Organize User Stories into MVP, v0.1, v1 and other deliveries.
					</p>
				</div>
				{canManageVersions && !readOnly && (
					<Button onClick={openCreateDialog}>
						<Plus className="mr-2 h-4 w-4" />
						New version
					</Button>
				)}
			</div>

			<Separator />

			<div className="space-y-4">
				{versionData.versions.map((version, index) => (
					<ProductVersionCard
						key={version.id}
						version={version}
						versions={versionData.versions}
						index={index}
						versionCount={versionData.versions.length}
						canManageVersions={canManageVersions}
						readOnly={readOnly}
						onMoveVersion={moveVersion}
						onMoveStory={moveStory}
						onAssignStory={assignStory}
						onEdit={openEditDialog}
						onDelete={() => deleteVersion.mutate({ id: version.id })}
						onStart={() => startVersion.mutate({ id: version.id })}
						onComplete={() => completeVersion.mutate({ id: version.id })}
						onCancel={() => cancelVersion.mutate({ id: version.id })}
						onReopen={() => reopenVersion.mutate({ id: version.id })}
					/>
				))}
				{versionData.versions.length === 0 && (
					<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
						No product versions yet.
					</div>
				)}
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0">
					<div>
						<h3 className="font-semibold">Without a version</h3>
						<p className="text-muted-foreground text-sm">
							User Stories still in the general backlog.
						</p>
					</div>
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Search stories"
						className="max-w-xs"
					/>
				</CardHeader>
				<CardContent className="space-y-2">
					{visibleStories.map((story) => (
						<StoryRow
							key={story.id}
							story={story}
							versions={versionData.versions}
							readOnly={readOnly}
							onAssign={(versionId) =>
								assignStory(
									story.id,
									versionId,
									versionData.versions.find(
										(version) => version.id === versionId
									)?.tasks.length ?? 0
								)
							}
						/>
					))}
					{visibleStories.length === 0 && (
						<p className="py-3 text-muted-foreground text-sm">
							{versionData.unassignedStories.length === 0
								? 'All User Stories belong to a version.'
								: 'No stories match the search.'}
						</p>
					)}
				</CardContent>
			</Card>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<ProductVersionDialog
					projectId={projectId}
					isTemplate={isTemplate}
					version={editingVersion}
					onClose={() => setDialogOpen(false)}
				/>
			</Dialog>
		</div>
	);
}

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

function ProductVersionCard({
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
	const status = version.status;
	const canEdit = canManageVersions && !readOnly;
	const canMoveStories = !readOnly;

	return (
		<Card>
			<CardHeader className="space-y-3">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="flex min-w-0 items-start gap-3">
						<div className="flex shrink-0 flex-col gap-1">
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
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<h3 className="font-semibold text-lg">{version.name}</h3>
								{status && (
									<Badge
										variant={status === 'COMPLETED' ? 'success' : 'secondary'}
									>
										{statusIcon(status)}
										<span className="ml-1">{statusLabel[status]}</span>
									</Badge>
								)}
							</div>
							{version.description && (
								<p className="mt-1 text-muted-foreground text-sm">
									{version.description}
								</p>
							)}
						</div>
					</div>
					<div className="flex items-center gap-1">
						{canEdit && (
							<>
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
										className="text-destructive"
										aria-label={`Delete ${version.name}`}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</ConfirmationDialog>
							</>
						)}
					</div>
				</div>
				<div className="flex items-center gap-3">
					<Progress value={progress} className="h-2 flex-1" />
					<span className="text-muted-foreground text-sm tabular-nums">
						{progress}%
					</span>
					<span className="text-muted-foreground text-sm">
						{version.tasks.length} US
					</span>
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
								<Play className="mr-1.5 h-3.5 w-3.5" /> Start
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
								<Check className="mr-1.5 h-3.5 w-3.5" /> Complete
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
			<CardContent className="space-y-2">
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
					<p className="py-2 text-muted-foreground text-sm">
						No User Stories in this version. Progress: 0%.
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function StoryRow({
	story,
	versions,
	readOnly,
	onAssign,
	onMoveUp,
	onMoveDown,
	canMove = true
}: {
	story: Story;
	versions: ProductVersion[];
	readOnly: boolean;
	onAssign: (versionId: string | null) => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	canMove?: boolean;
}) {
	return (
		<div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
			<div className="min-w-0 flex-1">
				<div className="font-medium text-sm">{story.title}</div>
				<div className="text-muted-foreground text-xs">
					{story.publicNumber ? `#${story.publicNumber} · ` : ''}
					{story.status ?? 'Backlog'}
				</div>
			</div>
			{onMoveUp && onMoveDown && (
				<div className="flex gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						disabled={readOnly}
						onClick={onMoveUp}
						aria-label={`Move ${story.title} up`}
					>
						<ArrowUp className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						disabled={readOnly}
						onClick={onMoveDown}
						aria-label={`Move ${story.title} down`}
					>
						<ArrowDown className="h-3.5 w-3.5" />
					</Button>
				</div>
			)}
			{canMove && (
				<select
					value=""
					disabled={readOnly}
					onChange={(event) =>
						onAssign(
							event.target.value === '__unassigned'
								? null
								: event.target.value || null
						)
					}
					className="h-9 rounded-md border bg-background px-2 text-sm"
				>
					<option value="">Move to...</option>
					<option value="__unassigned">No version</option>
					{versions.map((version) => (
						<option key={version.id} value={version.id}>
							{version.name}
						</option>
					))}
				</select>
			)}
		</div>
	);
}
