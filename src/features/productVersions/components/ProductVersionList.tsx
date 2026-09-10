'use client';

import type { ProductVersionStatusEnum } from '@prisma/client';
import { Layers3, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent, CardHeader } from '~/common/components/ui/card';
import { Dialog } from '~/common/components/ui/dialog';
import { Input } from '~/common/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { cn } from '~/lib/utils';
import { type RouterOutputs, api } from '~/trpc/react';
import ProductVersionCard, {
	countCompletedStories,
	statusLabel,
	type ProductVersion
} from './ProductVersionCard';
import ProductVersionDialog from './ProductVersionDialog';
import StoryRow from './StoryRow';

type VersionData = RouterOutputs['productVersion']['getAll'];

interface ProductVersionListProps {
	projectId: string;
	isTemplate?: boolean;
	canManageVersions?: boolean;
	readOnly?: boolean;
}

type StatusFilter = 'ALL' | ProductVersionStatusEnum;

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
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
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
	const normalizedSearch = search.trim().toLowerCase();
	const filteredVersions = versionData.versions
		.map((version, index) => ({ version, index }))
		.filter(({ version }) => {
			const matchesStatus =
				statusFilter === 'ALL' || version.status === statusFilter;
			const matchesSearch =
				!normalizedSearch ||
				version.name.toLowerCase().includes(normalizedSearch) ||
				(version.description?.toLowerCase().includes(normalizedSearch) ??
					false) ||
				version.tasks.some((story) =>
					story.title.toLowerCase().includes(normalizedSearch)
				);
			return matchesStatus && matchesSearch;
		});
	const visibleStories = versionData.unassignedStories.filter((story) =>
		story.title.toLowerCase().includes(normalizedSearch)
	);
	const totalStories = versionData.versions.reduce(
		(total, version) => total + version.tasks.length,
		0
	);
	const completedStories = versionData.versions.reduce(
		(total, version) => total + countCompletedStories(version.tasks),
		0
	);
	const activeVersions = versionData.versions.filter(
		(version) => version.status === 'IN_PROGRESS'
	).length;
	const hasFilters = Boolean(normalizedSearch) || statusFilter !== 'ALL';

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
		<div className="space-y-6 p-4 sm:p-6">
			<header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
				<div className="flex items-start gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
						<Layers3 className="h-5 w-5" />
					</div>
					<div>
						<p className="font-medium text-primary text-xs uppercase tracking-wider">
							Delivery planning
						</p>
						<h2 className="mt-1 font-semibold text-2xl tracking-tight">
							Product versions
						</h2>
						<p className="mt-1 max-w-xl text-muted-foreground text-sm">
							Organize User Stories into focused deliveries and track their
							progress.
						</p>
					</div>
				</div>
				{canManageVersions && !readOnly && (
					<Button onClick={openCreateDialog} className="sm:shrink-0">
						<Plus className="mr-2 h-4 w-4" />
						New version
					</Button>
				)}
			</header>

			<div className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card sm:grid-cols-4">
				<VersionStat label="Versions" value={versionData.versions.length} />
				<VersionStat label="In progress" value={activeVersions} />
				<VersionStat
					label="Stories done"
					value={`${completedStories}/${totalStories}`}
				/>
				<VersionStat
					label="Unassigned"
					value={versionData.unassignedStories.length}
					accent={versionData.unassignedStories.length > 0}
				/>
			</div>

			<div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
				<div className="relative min-w-0 flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Search versions or stories"
						aria-label="Search versions or stories"
						className="border-0 pl-9 shadow-none focus-visible:ring-1"
					/>
				</div>
				<Select
					value={statusFilter}
					onValueChange={(value) => setStatusFilter(value as StatusFilter)}
				>
					<SelectTrigger className="w-full sm:w-44">
						<SelectValue placeholder="Filter status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">All statuses</SelectItem>
						{Object.entries(statusLabel).map(([value, label]) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-4">
				{filteredVersions.map(({ version, index }) => (
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
				{filteredVersions.length === 0 && (
					<div className="rounded-xl border border-dashed p-10 text-center">
						<p className="font-medium text-sm">
							{hasFilters
								? 'No versions match your filters'
								: 'No product versions yet'}
						</p>
						<p className="mt-1 text-muted-foreground text-sm">
							{hasFilters
								? 'Try a different search or status.'
								: 'Create a version to start organizing User Stories.'}
						</p>
						{hasFilters && (
							<Button
								variant="link"
								onClick={() => {
									setSearch('');
									setStatusFilter('ALL');
								}}
							>
								Clear filters
							</Button>
						)}
					</div>
				)}
			</div>

			<Card className="overflow-hidden">
				<CardHeader className="flex flex-col gap-3 border-b bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
					<div>
						<div className="flex items-center gap-2">
							<h3 className="font-semibold">Without a version</h3>
							{versionData.unassignedStories.length > 0 && (
								<Badge variant="warning">
									{versionData.unassignedStories.length}
								</Badge>
							)}
						</div>
						<p className="mt-1 text-muted-foreground text-sm">
							User Stories still in the general backlog.
						</p>
					</div>
				</CardHeader>
				<CardContent className="space-y-2 p-4 sm:p-6">
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

function VersionStat({
	label,
	value,
	accent = false
}: {
	label: string;
	value: number | string;
	accent?: boolean;
}) {
	return (
		<div className="border-b p-4 first:border-l-0 sm:border-b-0 sm:border-l sm:p-5 first:sm:border-l-0">
			<p className="text-muted-foreground text-xs">{label}</p>
			<p
				className={cn(
					'mt-1 font-semibold text-xl tabular-nums tracking-tight',
					accent && 'text-warning-muted-foreground'
				)}
			>
				{value}
			</p>
		</div>
	);
}
