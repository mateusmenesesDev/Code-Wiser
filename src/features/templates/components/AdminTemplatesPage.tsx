'use client';

import { Protect } from '@clerk/nextjs';
import {
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors
} from '@dnd-kit/core';
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit, Eye, GripVertical, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Input } from '~/common/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { Switch } from '~/common/components/ui/switch';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';
import {
	getBadgeAccessTypeColor,
	getBadgeTemplateStatusColor,
	getDifficultyBadgeColor
} from '~/common/utils/colorUtils';
import { formatTemplateStatus } from '~/common/utils/projectUtils';
import { cn } from '~/lib/utils';
import type { RouterOutputs } from '~/trpc/react';
import { useAdminTemplates } from '../hook/useAdminTemplates';
import { CreateProjectFromJsonDialog } from './CreateProjectFromJsonDialog';
import { CreateProjectTemplateDialog } from './CreateProjectTemplateDialog';

type AdminTemplate = RouterOutputs['projectTemplate']['getAll'][number];

function SortableTemplateRow({
	template,
	canReorder,
	isToggling,
	isDeleting,
	onTogglePublish,
	onDelete
}: {
	template: AdminTemplate;
	canReorder: boolean;
	isToggling: boolean;
	isDeleting: boolean;
	onTogglePublish: (id: string, status: string) => void;
	onDelete: (id: string) => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging
	} = useSortable({ id: template.id, disabled: !canReorder });

	const accessType = template.accessType;
	const isPublished = template.status === 'APPROVED';

	return (
		<TableRow
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition
			}}
			className={cn(isDragging && 'relative z-10 bg-muted/50 opacity-80')}
		>
			<TableCell className="w-10">
				{canReorder ? (
					<button
						type="button"
						className="flex h-8 w-8 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
						aria-label={`Drag to reorder ${template.title}`}
						{...attributes}
						{...listeners}
					>
						<GripVertical className="h-4 w-4" />
					</button>
				) : (
					<span className="block w-8" />
				)}
			</TableCell>
			<TableCell>
				<div>
					<div className="font-medium">{template.title}</div>
					<div className="line-clamp-1 text-muted-foreground text-sm">
						{template.description}
					</div>
				</div>
			</TableCell>
			<TableCell>
				<Badge variant="secondary">{template.category.name}</Badge>
			</TableCell>
			<TableCell>
				<Badge variant={getBadgeAccessTypeColor(accessType)}>
					{accessType}
				</Badge>
			</TableCell>
			<TableCell>
				<Badge variant={getDifficultyBadgeColor(template.difficulty)}>
					{template.difficulty}
				</Badge>
			</TableCell>
			<TableCell>
				<Badge variant={getBadgeTemplateStatusColor(template.status)}>
					{formatTemplateStatus(template.status)}
				</Badge>
			</TableCell>
			<TableCell>
				<div className="flex items-center gap-2">
					<Switch
						checked={isPublished}
						onCheckedChange={() =>
							onTogglePublish(template.id, template.status)
						}
						disabled={isToggling}
					/>
					<span className="text-sm">
						{isPublished ? 'Published' : 'Draft'}
					</span>
				</div>
			</TableCell>
			<TableCell className="text-muted-foreground text-sm">
				{new Date(template.createdAt).toLocaleDateString()}
			</TableCell>
			<TableCell className="text-right">
				<div className="flex items-center justify-end gap-2">
					<Button variant="ghost" size="sm" asChild>
						<Link href={`/admin/templates/${template.id}`}>
							<Eye className="h-4 w-4" />
						</Link>
					</Button>
					<Button variant="ghost" size="sm" asChild>
						<Link href={`/admin/templates/${template.id}/edit`}>
							<Edit className="h-4 w-4" />
						</Link>
					</Button>
					<ConfirmationDialog
						title="Delete Template"
						description={`Are you sure you want to delete "${template.title}"? This action cannot be undone.`}
						onConfirm={() => onDelete(template.id)}
					>
						<Button
							variant="ghost"
							size="sm"
							disabled={isDeleting}
							className="text-destructive hover:text-destructive"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</ConfirmationDialog>
				</div>
			</TableCell>
		</TableRow>
	);
}

export default function AdminTemplatesPage() {
	const {
		templates,
		isLoading,
		searchTerm,
		setSearchTerm,
		categoryFilter,
		setCategoryFilter,
		accessFilter,
		setAccessFilter,
		difficultyFilter,
		setDifficultyFilter,
		statusFilter,
		setStatusFilter,
		clearFilters,
		hasActiveFilters,
		canReorder,
		deleteTemplate,
		togglePublishStatus,
		reorderTemplates,
		isDeleting,
		isToggling,
		refetch
	} = useAdminTemplates();

	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showCreateFromJsonDialog, setShowCreateFromJsonDialog] =
		useState(false);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 6 }
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates
		})
	);

	const handleTemplateCreated = () => {
		refetch();
	};

	const handleDragEnd = (event: DragEndEvent) => {
		if (!canReorder || !templates) return;

		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = templates.findIndex(
			(template) => template.id === active.id
		);
		const newIndex = templates.findIndex((template) => template.id === over.id);
		if (oldIndex < 0 || newIndex < 0) return;

		reorderTemplates(arrayMove(templates, oldIndex, newIndex));
	};

	return (
		// biome-ignore lint/a11y/useValidAriaRole: <explanation>
		<Protect role="org:admin">
			<div className="container mx-auto px-4 py-8">
				{/* Page Header */}
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="font-bold text-3xl text-foreground">
							Project Templates
						</h1>
						<p className="mt-2 text-muted-foreground">
							Manage project templates for users to explore and start
						</p>
					</div>
					<div className="flex gap-2">
						<Button
							onClick={() => setShowCreateFromJsonDialog(true)}
							variant="outline"
						>
							Create from JSON
						</Button>
						<Button
							onClick={() => setShowCreateDialog(true)}
							className="bg-info text-info-foreground hover:bg-info/90"
						>
							<Plus className="mr-2 h-4 w-4" />
							Add New Project
						</Button>
					</div>
				</div>

				{/* Filters */}
				<Card className="mb-6">
					<CardHeader>
						<CardTitle level={2} className="text-lg">
							Filters & Search
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-5">
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search templates..."
									value={searchTerm ?? ''}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>

							<Select value={categoryFilter} onValueChange={setCategoryFilter}>
								<SelectTrigger>
									<SelectValue placeholder="Category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Categories</SelectItem>
									<SelectItem value="Web Development">
										Web Development
									</SelectItem>
									<SelectItem value="Mobile Development">
										Mobile Development
									</SelectItem>
									<SelectItem value="Data Science">Data Science</SelectItem>
									<SelectItem value="DevOps">DevOps</SelectItem>
								</SelectContent>
							</Select>

							<Select value={accessFilter} onValueChange={setAccessFilter}>
								<SelectTrigger>
									<SelectValue placeholder="Access Type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Access Types</SelectItem>
									<SelectItem value="Free">Free</SelectItem>
									<SelectItem value="Credits">Credits</SelectItem>
								</SelectContent>
							</Select>

							<Select
								value={difficultyFilter}
								onValueChange={setDifficultyFilter}
							>
								<SelectTrigger>
									<SelectValue placeholder="Difficulty" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Difficulties</SelectItem>
									<SelectItem value="BEGINNER">Beginner</SelectItem>
									<SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
									<SelectItem value="ADVANCED">Advanced</SelectItem>
								</SelectContent>
							</Select>

							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger>
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="APPROVED">Published</SelectItem>
									<SelectItem value="PENDING">Draft</SelectItem>
									<SelectItem value="REJECTED">Rejected</SelectItem>
									<SelectItem value="REQUESTED_CHANGES">
										Changes Requested
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{hasActiveFilters && (
							<div className="mt-4">
								<Button variant="outline" size="sm" onClick={clearFilters}>
									Clear All Filters
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Results Summary */}
				<div className="mb-6 flex items-center justify-between">
					<p className="text-muted-foreground">
						Showing{' '}
						<span className="font-semibold">{templates?.length ?? 0}</span>{' '}
						templates
					</p>
					{hasActiveFilters ? (
						<p className="text-muted-foreground text-sm">
							Clear filters to reorder templates for the home page
						</p>
					) : (
						<p className="text-muted-foreground text-sm">
							Drag rows to set the order shown on the home page
						</p>
					)}
				</div>

				{/* Templates Table */}
				<Card>
					<CardContent className="p-0">
						{isLoading ? (
							<div className="p-8 text-center">
								<div className="mx-auto h-8 w-8 animate-spin rounded-full border-info border-b-2" />
								<p className="mt-2 text-muted-foreground">
									Loading templates...
								</p>
							</div>
						) : (
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={handleDragEnd}
							>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-10" />
											<TableHead>Title</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Access Type</TableHead>
											<TableHead>Difficulty</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Published</TableHead>
											<TableHead>Created</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										<SortableContext
											items={templates?.map((template) => template.id) ?? []}
											strategy={verticalListSortingStrategy}
										>
											{templates?.map((template) => (
												<SortableTemplateRow
													key={template.id}
													template={template}
													canReorder={canReorder}
													isToggling={isToggling}
													isDeleting={isDeleting}
													onTogglePublish={togglePublishStatus}
													onDelete={deleteTemplate}
												/>
											))}
										</SortableContext>
									</TableBody>
								</Table>
							</DndContext>
						)}
					</CardContent>
				</Card>

				{templates?.length === 0 && !isLoading && (
					<div className="py-12 text-center">
						<p className="text-muted-foreground">
							No templates found matching your criteria.
						</p>
					</div>
				)}
			</div>

			{/* Create Project Template Dialog */}
			<CreateProjectTemplateDialog
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
				onTemplateCreated={handleTemplateCreated}
			/>

			{/* Create Project Template from JSON Dialog */}
			<CreateProjectFromJsonDialog
				open={showCreateFromJsonDialog}
				onOpenChange={setShowCreateFromJsonDialog}
				onTemplateCreated={handleTemplateCreated}
			/>
		</Protect>
	);
}
