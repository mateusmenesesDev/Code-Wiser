import { zodResolver } from '@hookform/resolvers/zod';
import type { Task } from '@prisma/client';
import { TaskPriorityEnum, TaskStatusEnum, TaskTypeEnum } from '@prisma/client';
import {
	Clock,
	GitBranch,
	Loader2,
	MessageSquare,
	Plus,
	Tag,
	X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Avatar, AvatarFallback } from '~/common/components/ui/avatar';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import { Separator } from '~/common/components/ui/separator';
import { Switch } from '~/common/components/ui/switch';
import { Textarea } from '~/common/components/ui/textarea';
import { useDialog } from '~/common/hooks/useDialog';
import {
	createTaskSchema,
	updateTaskSchema
} from '~/features/workspace/schemas/task.schema';
import { cn } from '~/lib/utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface TaskDialogProps {
	task?: Task;
	projectId?: string;
	projectTemplateId?: string;
	comments?: Array<{
		id: string;
		content: string;
		createdAt: Date;
		author: {
			id: string;
			name: string | null;
			email: string;
		};
	}>;
	onAddComment?: (content: string) => Promise<void>;
	isAddingComment?: boolean;
	epics?: Array<{ id: string; title: string }>;
	sprints?: Array<{ id: string; title: string }>;
	onSubmit: (
		data: z.infer<typeof createTaskSchema> | z.infer<typeof updateTaskSchema>
	) => Promise<void>;
	isSubmitting?: boolean;
}

interface TagsInputProps {
	value: string[];
	onChange: (tags: string[]) => void;
}

function TagsInput({ value, onChange }: TagsInputProps) {
	const [newTag, setNewTag] = useState('');

	const handleAddTag = () => {
		if (newTag.trim() && !value.includes(newTag.trim())) {
			onChange([...value, newTag.trim()]);
			setNewTag('');
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		onChange(value.filter((tag) => tag !== tagToRemove));
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleAddTag();
		}
	};

	return (
		<div className="space-y-2">
			<Label className="flex items-center gap-1">Labels</Label>
			<div className="flex gap-2">
				<Input
					placeholder="Add tag"
					value={newTag}
					onChange={(e) => setNewTag(e.target.value)}
					onKeyDown={handleKeyDown}
				/>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleAddTag}
				>
					<Plus className="h-4 w-4" />
				</Button>
			</div>
			{value.length > 0 && (
				<div className="mt-2 flex flex-wrap gap-1">
					{value.map((tag) => (
						<Badge
							key={tag}
							variant="secondary"
							className="flex items-center gap-1"
						>
							<Tag className="h-3 w-3" />
							{tag}
							<button
								type="button"
								onClick={() => handleRemoveTag(tag)}
								className="hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
				</div>
			)}
		</div>
	);
}

export function TaskDialog({
	task,
	projectId,
	projectTemplateId,
	comments = [],
	onAddComment,
	isAddingComment = false,
	epics = [],
	sprints = [],
	onSubmit,
	isSubmitting = false
}: TaskDialogProps) {
	const { isDialogOpen, closeDialog } = useDialog('task');
	const [prUrl, setPrUrl] = useState('');
	const [newComment, setNewComment] = useState('');

	const isEditing = !!task;

	const form = useForm<
		z.infer<typeof createTaskSchema> | z.infer<typeof updateTaskSchema>
	>({
		resolver: zodResolver(isEditing ? updateTaskSchema : createTaskSchema),
		defaultValues:
			isEditing && task
				? {
						id: task.id,
						title: task.title,
						description: task.description || undefined,
						type: task.type || undefined,
						priority: task.priority || undefined,
						tags: task.tags || [],
						epicId: task.epicId || undefined,
						sprintId: task.sprintId || undefined,
						assigneeId: task.assigneeId || undefined,
						blockedReason: task.blockedReason || undefined,
						blocked: task.blocked || false,
						status: task.status || undefined,
						dueDate: task.dueDate ? new Date(task.dueDate) : undefined
					}
				: {
						title: '',
						description: '',
						type: TaskTypeEnum.TASK,
						priority: TaskPriorityEnum.MEDIUM,
						tags: [],
						blocked: false,
						status: TaskStatusEnum.BACKLOG,
						projectId,
						projectTemplateId
					}
	});

	useEffect(() => {
		if (isDialogOpen && task) {
			form.reset({
				id: task.id,
				title: task.title,
				description: task.description || undefined,
				type: task.type || undefined,
				priority: task.priority || undefined,
				tags: task.tags || [],
				epicId: task.epicId || undefined,
				sprintId: task.sprintId || undefined,
				assigneeId: task.assigneeId || undefined,
				blockedReason: task.blockedReason || undefined,
				blocked: task.blocked || false,
				status: task.status || undefined,
				dueDate: task.dueDate ? new Date(task.dueDate) : undefined
			});
		}
	}, [isDialogOpen, task, form]);

	const getStatusLabel = (status: TaskStatusEnum) => {
		switch (status) {
			case TaskStatusEnum.BACKLOG:
				return 'To Do';
			case TaskStatusEnum.READY_TO_DEVELOP:
				return 'Ready to Develop';
			case TaskStatusEnum.IN_PROGRESS:
				return 'In Progress';
			case TaskStatusEnum.CODE_REVIEW:
				return 'Code Review';
			case TaskStatusEnum.DONE:
				return 'Done';
			default:
				return status;
		}
	};

	const handleAddComment = async () => {
		if (!newComment.trim() || !onAddComment) return;

		try {
			await onAddComment(newComment.trim());
			setNewComment('');
		} catch (error) {
			console.error('Error adding comment:', error);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			void handleAddComment();
		}
	};

	const handleSubmit = form.handleSubmit(async (data) => {
		try {
			await onSubmit(data);
			closeDialog();
		} catch (error) {
			console.error('Error submitting task:', error);
		}
	});

	return (
		<Dialog open={isDialogOpen} onOpenChange={closeDialog}>
			<DialogContent className="max-w-5xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="pr-8 font-semibold text-xl">
						{isEditing ? 'Edit Task' : 'Create Task'}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						{/* Main Content */}
						<div className="space-y-6 lg:col-span-2">
							{/* Title */}
							<div>
								<Label htmlFor="title" className="mb-2 block">
									Title
								</Label>
								<Input
									id="title"
									{...form.register('title')}
									placeholder="Task title"
									className="w-full"
								/>
								{form.formState.errors.title && (
									<p className="mt-1 text-red-500 text-sm">
										{form.formState.errors.title.message}
									</p>
								)}
							</div>

							{/* Description */}
							<div>
								<Label htmlFor="description" className="mb-2 block">
									Description
								</Label>
								<Textarea
									id="description"
									{...form.register('description')}
									placeholder="Task description"
									className="min-h-[100px]"
								/>
							</div>

							{/* Code Review Request Section */}
							<div
								className={cn(
									'rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:border-purple-700 dark:from-purple-900/20 dark:to-blue-900/20',
									!isEditing && 'opacity-50'
								)}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<h3 className="mb-2 font-semibold text-purple-700 text-sm dark:text-purple-300">
											Need help with this task?
										</h3>
										<p className="mb-3 text-purple-600 text-sm dark:text-purple-400">
											Get your code reviewed by an experienced mentor. They'll
											provide feedback on your implementation, suggest
											improvements, and help you learn best practices.
										</p>
										<div className="flex items-center gap-2 text-purple-500 text-xs dark:text-purple-400">
											<span>💳 Costs 5 credits</span>
											<span>•</span>
											<span>✨ Free with mentorship plan</span>
										</div>
									</div>
									<Button
										disabled={true}
										className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
										size="sm"
									>
										{!isEditing
											? 'Available after creation'
											: 'Request CR (Soon)'}
									</Button>
								</div>
							</div>

							{/* Blocked Status Display Section - Only show if task is actually blocked */}
							{isEditing && task?.blocked && (
								<div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
									<div className="flex items-start gap-3">
										<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
										<div className="flex-1">
											<h3 className="mb-1 font-semibold text-red-700 text-sm dark:text-red-300">
												Task Blocked
											</h3>
											<p className="text-red-600 text-sm dark:text-red-400">
												{task.blockedReason ||
													'This task is currently blocked.'}
											</p>
										</div>
									</div>
								</div>
							)}

							{/* Links and Pull Request */}
							<div className={cn('space-y-4', !isEditing && 'opacity-50')}>
								<div>
									<h3 className="mb-2 font-medium text-muted-foreground text-sm">
										Pull Request
									</h3>
									<div className="flex gap-2">
										<Input
											type="url"
											value={prUrl}
											onChange={(e) => setPrUrl(e.target.value)}
											placeholder="https://github.com/user/repo/pull/123"
											className="flex-1"
											disabled={!isEditing}
										/>
										<Button variant="outline" size="sm" disabled={!isEditing}>
											{!isEditing ? 'Available after creation' : 'Save (Soon)'}
										</Button>
									</div>
									{prUrl && isEditing && (
										<Button
											variant="outline"
											size="sm"
											className="mt-2"
											asChild
										>
											<a href={prUrl} target="_blank" rel="noopener noreferrer">
												<GitBranch className="mr-2 h-4 w-4" />
												View Pull Request
											</a>
										</Button>
									)}
								</div>
							</div>

							{/* Comments */}
							<div className={cn(!isEditing && 'opacity-50')}>
								<h3 className="mb-3 font-medium text-muted-foreground text-sm">
									<MessageSquare className="mr-1 inline h-4 w-4" />
									Comments ({isEditing ? comments.length : 0})
								</h3>

								{isEditing ? (
									<>
										<div className="max-h-60 space-y-3 overflow-y-auto">
											{comments.map((comment) => {
												const isOptimistic = comment.id.startsWith('temp-');
												return (
													<div
														key={comment.id}
														className={cn(
															'flex gap-3',
															isOptimistic && 'opacity-70'
														)}
													>
														<Avatar className="h-8 w-8">
															<AvatarFallback className="text-xs">
																{comment.author.name?.[0] ||
																	comment.author.email[0]}
															</AvatarFallback>
														</Avatar>
														<div className="flex-1 space-y-1">
															<div className="flex items-center gap-2">
																<span className="font-medium text-sm">
																	{comment.author.name || comment.author.email}
																</span>
																<span className="text-muted-foreground text-xs">
																	{dayjs(comment.createdAt).fromNow()}
																</span>
																{isOptimistic && (
																	<span className="text-muted-foreground text-xs italic">
																		Sending...
																	</span>
																)}
															</div>
															<p className="text-sm">{comment.content}</p>
														</div>
													</div>
												);
											})}
										</div>

										{/* Add Comment */}
										<div className="mt-4 space-y-2">
											<Textarea
												placeholder="Add a comment... (Ctrl+Enter to submit)"
												value={newComment}
												onChange={(e) => setNewComment(e.target.value)}
												onKeyDown={handleKeyDown}
												className="min-h-[80px]"
												disabled={isAddingComment}
											/>
											<Button
												onClick={handleAddComment}
												size="sm"
												disabled={isAddingComment || !newComment.trim()}
											>
												{isAddingComment && (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												)}
												{isAddingComment ? 'Adding...' : 'Add Comment'}
											</Button>
										</div>
									</>
								) : (
									<div className="rounded-lg border border-muted-foreground/25 border-dashed p-6 text-center">
										<MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
										<p className="text-muted-foreground text-sm">
											Comments will be available after creating the task
										</p>
									</div>
								)}
							</div>
						</div>

						{/* Sidebar */}
						<div className="space-y-6 border-border border-l pl-4">
							{/* Status */}
							<div>
								<Label htmlFor="status" className="mb-2 block">
									Status
								</Label>
								<select
									id="status"
									{...form.register('status')}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
								>
									{Object.values(TaskStatusEnum).map((status) => (
										<option key={status} value={status}>
											{getStatusLabel(status)}
										</option>
									))}
								</select>
							</div>

							{/* Priority */}
							<div>
								<Label htmlFor="priority" className="mb-2 block">
									Priority
								</Label>
								<select
									id="priority"
									{...form.register('priority')}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
								>
									{Object.values(TaskPriorityEnum).map((priority) => (
										<option key={priority} value={priority}>
											{priority}
										</option>
									))}
								</select>
							</div>

							{/* Assignee */}
							<div>
								<Label htmlFor="assigneeId" className="mb-2 block">
									Assignee
								</Label>
								<Input
									id="assigneeId"
									{...form.register('assigneeId')}
									placeholder="Assignee ID"
								/>
							</div>

							{/* Due Date */}
							<div>
								<Label htmlFor="dueDate" className="mb-2 block">
									Due Date
								</Label>
								<Input id="dueDate" type="date" {...form.register('dueDate')} />
							</div>

							{/* Epic */}
							<div>
								<Label htmlFor="epicId" className="mb-2 block">
									Epic
								</Label>
								<select
									id="epicId"
									{...form.register('epicId')}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
									disabled={epics.length === 0}
								>
									<option value="">
										{epics.length === 0 ? 'No epics available' : 'Select Epic'}
									</option>
									{epics.map((epic) => (
										<option key={epic.id} value={epic.id}>
											{epic.title}
										</option>
									))}
								</select>
							</div>

							{/* Sprint */}
							<div>
								<Label htmlFor="sprintId" className="mb-2 block">
									Sprint
								</Label>
								<select
									id="sprintId"
									{...form.register('sprintId')}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
									disabled={sprints.length === 0}
								>
									<option value="">
										{sprints.length === 0
											? 'No sprints available'
											: 'Select Sprint'}
									</option>
									{sprints.map((sprint) => (
										<option key={sprint.id} value={sprint.id}>
											{sprint.title}
										</option>
									))}
								</select>
							</div>

							{/* Blocked Status Toggle */}
							<div className="space-y-3 rounded-lg border bg-muted/20 p-4">
								<div className="flex items-center space-x-2">
									<Switch id="blocked" {...form.register('blocked')} />
									<Label htmlFor="blocked" className="font-medium text-sm">
										This task is blocked
									</Label>
								</div>
								<p className="text-muted-foreground text-xs">
									Mark this task as blocked if it cannot proceed
								</p>

								{form.watch('blocked') && (
									<div className="space-y-2">
										<Label
											htmlFor="blockedReason"
											className="font-medium text-sm"
										>
											Blocked Reason
										</Label>
										<Textarea
											id="blockedReason"
											{...form.register('blockedReason')}
											placeholder="Explain why this task is blocked..."
											className="min-h-[80px]"
										/>
									</div>
								)}
							</div>

							{/* Tags */}
							<div>
								<TagsInput
									value={form.watch('tags') || []}
									onChange={(tags) => form.setValue('tags', tags)}
								/>
							</div>

							{/* Task Metadata - Only show when editing */}
							{isEditing && (
								<>
									<Separator />

									{/* Task ID */}
									<div>
										<h3 className="mb-2 font-medium text-muted-foreground text-sm">
											Task ID
										</h3>
										<code className="rounded bg-muted px-2 py-1 text-xs">
											{task.id}
										</code>
									</div>

									{/* Created */}
									<div>
										<h3 className="mb-2 font-medium text-muted-foreground text-sm">
											Created
										</h3>
										<div className="flex items-center gap-2 text-sm">
											<Clock className="h-4 w-4" />
											{dayjs(task.createdAt).fromNow()}
										</div>
									</div>
								</>
							)}
						</div>
					</div>

					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={closeDialog}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{isSubmitting
								? isEditing
									? 'Updating...'
									: 'Creating...'
								: isEditing
									? 'Update Task'
									: 'Create Task'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
