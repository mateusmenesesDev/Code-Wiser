import { zodResolver } from '@hookform/resolvers/zod';
import type { Task } from '@prisma/client';
import { TaskPriorityEnum, TaskStatusEnum } from '@prisma/client';
import { Clock, GitBranch, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { z } from 'zod';
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
import RichText from '~/common/components/RichText';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { TagsInput } from './TagsInput';
import { TaskComments } from './TaskComments';

dayjs.extend(relativeTime);

type TaskFormData =
	| z.infer<typeof createTaskSchema>
	| z.infer<typeof updateTaskSchema>;

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
	epics?: Array<{ id: string; title: string }>;
	sprints?: Array<{ id: string; title: string }>;
	onSubmit: (data: TaskFormData) => Promise<void>;
	isSubmitting?: boolean;
}

export function TaskDialog({
	task,
	projectId,
	projectTemplateId,
	comments = [],
	epics = [],
	sprints = [],
	onSubmit,
	isSubmitting = false
}: TaskDialogProps) {
	const { isDialogOpen, closeDialog } = useDialog('task');

	const isEditing = !!task;

	const form = useForm<TaskFormData>({
		resolver: zodResolver(isEditing ? updateTaskSchema : createTaskSchema)
	});

	useEffect(() => {
		if (isDialogOpen && task) {
			const formData: TaskFormData = {
				id: task.id,
				title: task.title,
				description: task.description ?? undefined,
				type: task.type ?? undefined,
				priority: task.priority ?? undefined,
				tags: task.tags || [],
				epicId: task.epicId ?? undefined,
				sprintId: task.sprintId ?? undefined,
				assigneeId: task.assigneeId ?? undefined,
				blockedReason: task.blockedReason ?? undefined,
				blocked: task.blocked ?? false,
				status: task.status ?? undefined,
				dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
				projectId,
				projectTemplateId,
				storyPoints: task.storyPoints ?? undefined,
				prUrl: task.prUrl ?? undefined
			};
			form.reset(formData);
		}
	}, [isDialogOpen, task, form, projectId, projectTemplateId]);

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
			<DialogContent className="max-w-7xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="pr-8 font-semibold text-xl">
						{isEditing ? 'Edit Task' : 'Create Task'}
					</DialogTitle>
				</DialogHeader>
				<FormProvider {...form}>
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
								<RichText />

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
												{...form.register('prUrl')}
												placeholder="https://github.com/user/repo/pull/123"
												className="flex-1"
												disabled={!isEditing}
											/>
											<Button variant="outline" size="sm" disabled={!isEditing}>
												{!isEditing
													? 'Available after creation'
													: 'Save (Soon)'}
											</Button>
										</div>
										{form.watch('prUrl') && isEditing && (
											<Button
												variant="outline"
												size="sm"
												className="mt-2"
												asChild
											>
												<a
													href={form.watch('prUrl')}
													target="_blank"
													rel="noopener noreferrer"
												>
													<GitBranch className="mr-2 h-4 w-4" />
													View Pull Request
												</a>
											</Button>
										)}
									</div>
								</div>

								{/* Comments */}
								<TaskComments
									comments={comments}
									taskId={task?.id}
									isEditing={isEditing}
								/>
							</div>

							{/* Sidebar */}
							<div className="space-y-6 border-border border-l pl-4">
								{/* Status */}
								<div>
									<Label htmlFor="status" className="mb-2 block">
										Status
									</Label>
									<Select
										value={form.watch('status') || TaskStatusEnum.BACKLOG}
										onValueChange={(value) =>
											form.setValue('status', value as TaskStatusEnum)
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											{Object.values(TaskStatusEnum).map((status) => (
												<SelectItem key={status} value={status}>
													{getStatusLabel(status)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Priority */}
								<div>
									<Label htmlFor="priority" className="mb-2 block">
										Priority
									</Label>
									<Select
										value={form.watch('priority') || TaskPriorityEnum.MEDIUM}
										onValueChange={(value) =>
											form.setValue('priority', value as TaskPriorityEnum)
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select priority" />
										</SelectTrigger>
										<SelectContent>
											{Object.values(TaskPriorityEnum).map((priority) => (
												<SelectItem key={priority} value={priority}>
													{priority}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Assignee */}
								<div>
									<Label htmlFor="assigneeId" className="mb-2 block">
										Assignee
									</Label>
									<Select
										value={form.watch('assigneeId') ?? 'none'}
										onValueChange={(value) =>
											form.setValue(
												'assigneeId',
												value === 'none' ? undefined : value
											)
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select assignee" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">No assignee</SelectItem>
											{/* TODO: Add assignee list */}
										</SelectContent>
									</Select>
								</div>

								{/* Due Date */}
								<div>
									<Label htmlFor="dueDate" className="mb-2 block">
										Due Date
									</Label>
									<Input
										id="dueDate"
										type="date"
										{...form.register('dueDate', {
											setValueAs: (value: string) =>
												value ? new Date(value) : null
										})}
									/>
								</div>

								{/* Epic */}
								<div>
									<Label htmlFor="epicId" className="mb-2 block">
										Epic
									</Label>
									<Select
										value={form.watch('epicId') || 'none'}
										onValueChange={(value) =>
											form.setValue(
												'epicId',
												value === 'none' ? undefined : value
											)
										}
										disabled={epics.length === 0}
									>
										<SelectTrigger>
											<SelectValue
												placeholder={
													epics.length === 0
														? 'No epics available'
														: 'Select epic'
												}
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">No epic</SelectItem>
											{epics.map((epic) => (
												<SelectItem key={epic.id} value={epic.id}>
													{epic.title}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Sprint */}
								<div>
									<Label htmlFor="sprintId" className="mb-2 block">
										Sprint
									</Label>
									<Select
										value={form.watch('sprintId') || 'none'}
										onValueChange={(value) =>
											form.setValue(
												'sprintId',
												value === 'none' ? undefined : value
											)
										}
										disabled={sprints.length === 0}
									>
										<SelectTrigger>
											<SelectValue
												placeholder={
													sprints.length === 0
														? 'No sprints available'
														: 'Select sprint'
												}
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">No sprint</SelectItem>
											{sprints.map((sprint) => (
												<SelectItem key={sprint.id} value={sprint.id}>
													{sprint.title}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
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
							<Button
								type="submit"
								disabled={isSubmitting || !form.formState.isDirty}
							>
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
				</FormProvider>
			</DialogContent>
		</Dialog>
	);
}
