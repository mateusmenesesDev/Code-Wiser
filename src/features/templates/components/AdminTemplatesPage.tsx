'use client';

import { Protect } from '@clerk/nextjs';
import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
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
	getAccessTypeColor,
	getDifficultyColor,
	getTemplateStatusColor
} from '~/common/utils/colorUtils';
import {
	formatTemplateStatus,
	getAccessType
} from '~/common/utils/projectUtils';
import { useAdminTemplates } from '../hook/useAdminTemplates';
import { CreateProjectTemplateDialog } from './CreateProjectTemplateDialog';

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
		deleteTemplate,
		togglePublishStatus,
		isDeleting,
		isToggling,
		refetch
	} = useAdminTemplates();

	const [showCreateDialog, setShowCreateDialog] = useState(false);

	const handleTemplateCreated = () => {
		refetch();
	};

	return (
		<Protect permission="org:project:edit_template">
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
					<Button
						onClick={() => setShowCreateDialog(true)}
						className="bg-blue-600 hover:bg-blue-700"
					>
						<Plus className="mr-2 h-4 w-4" />
						Add New Project
					</Button>
				</div>

				{/* Filters */}
				<Card className="mb-6">
					<CardHeader>
						<CardTitle className="text-lg">Filters & Search</CardTitle>
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
				</div>

				{/* Templates Table */}
				<Card>
					<CardContent className="p-0">
						{isLoading ? (
							<div className="p-8 text-center">
								<div className="mx-auto h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
								<p className="mt-2 text-muted-foreground">
									Loading templates...
								</p>
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
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
									{templates?.map((template) => {
										const accessType = getAccessType(template.credits);
										const isPublished = template.status === 'APPROVED';

										return (
											<TableRow key={template.id}>
												<TableCell>
													<div>
														<div className="font-medium">{template.title}</div>
														<div className="line-clamp-1 text-muted-foreground text-sm">
															{template.description}
														</div>
													</div>
												</TableCell>
												<TableCell>
													<Badge variant="outline">
														{template.category.name}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge className={getAccessTypeColor(accessType)}>
														{accessType}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge
														className={getDifficultyColor(template.difficulty)}
													>
														{template.difficulty}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge
														className={getTemplateStatusColor(template.status)}
													>
														{formatTemplateStatus(template.status)}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<Switch
															checked={isPublished}
															onCheckedChange={() =>
																togglePublishStatus(
																	template.id,
																	template.status
																)
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
															<Link
																href={`/admin/templates/${template.id}/edit`}
															>
																<Edit className="h-4 w-4" />
															</Link>
														</Button>
														<ConfirmationDialog
															title="Delete Template"
															description={`Are you sure you want to delete "${template.title}"? This action cannot be undone.`}
															onConfirm={() => deleteTemplate(template.id)}
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
									})}
								</TableBody>
							</Table>
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
		</Protect>
	);
}
