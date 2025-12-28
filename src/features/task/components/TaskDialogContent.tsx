import { Protect } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskPriorityEnum, TaskStatusEnum } from '@prisma/client';
import { Clock, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { z } from 'zod';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
import { Button } from '~/common/components/ui/button';
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel
} from '~/common/components/ui/form';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import { Separator } from '~/common/components/ui/separator';
import { Switch } from '~/common/components/ui/switch';
import { Textarea } from '~/common/components/ui/textarea';
import { useTask } from '~/features/task/hooks/useTask';
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
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import { useUser } from '~/common/hooks/useUser';
import { usePRReview } from '~/features/prReview/hooks/usePRReview';
import type { CreateTaskInput } from '~/features/workspace/types/Task.type';
import { api } from '~/trpc/react';
import { getStatusLabel, resetFormData } from '../utils';
import { PullRequest } from './PullRequest';
import { TagsInput } from './TagsInput';
import { TaskComments } from './TaskComments';

interface TaskDialogProps {
	taskId?: string;
	projectId: string;
	onClose: () => void;
}

dayjs.extend(relativeTime);

type TaskFormData =
	| z.infer<typeof createTaskSchema>
	| z.infer<typeof updateTaskSchema>;

export function TaskDialogContent({
	taskId,
	projectId,
	onClose
}: TaskDialogProps) {
	const isTemplate = useIsTemplate();
	const { userHasMentorship, userCredits } = useUser();
	const {
		requestCodeReview,
		isRequestingCodeReview,
		updatePRReviewUrl,
		isUpdatingPRUrl,
		getActiveByTaskId
	} = usePRReview();
	const { data: activeReview } = getActiveByTaskId(
		{ taskId: taskId || '' },
		{ enabled: !!taskId }
	);
	const [prUrl, setPrUrl] = useState<string>('');

	const { data: task } = api.task.getById.useQuery(
		{ id: taskId || '' },
		{ enabled: !!taskId }
	);

	const { data: epics } = api.epic.getAllByProjectId.useQuery({
		projectId,
		isTemplate
	});
	const { data: sprints } = api.sprint.getAllByProjectId.useQuery({
		projectId,
		isTemplate
	});

	const {
		deleteTask,
		updateTask,
		createTask,
		generateTaskDescription,
		isGeneratingDescription
	} = useTask({
		projectId
	});

	const { data: projectMembers, isLoading: isLoadingMembers } =
		api.project.getMembers.useQuery(
			{ projectId },
			{ enabled: !!projectId && !isTemplate }
		);

	const isEditing = !!task;

	const form = useForm<TaskFormData>({
		resolver: zodResolver(isEditing ? updateTaskSchema : createTaskSchema),
		defaultValues: {
			status: TaskStatusEnum.BACKLOG,
			priority: TaskPriorityEnum.MEDIUM,
			blocked: false,
			tags: []
		}
	});

	useEffect(() => {
		const formData = resetFormData(task, projectId, isTemplate);
		form.reset(formData);
	}, [form, projectId, task, isTemplate]);

	// Update PR URL from active review
	useEffect(() => {
		if (activeReview?.prUrl) {
			setPrUrl(activeReview.prUrl);
		}
	}, [activeReview]);

	// Update epic and sprint values when epics/sprints are loaded
	useEffect(() => {
		if (!task) return;

		// Update epicId if task has one and epics are loaded
		if (task.epicId && epics && epics.length > 0) {
			const epicExists = epics.some((epic) => epic.id === task.epicId);
			if (epicExists) {
				const currentValue = form.getValues('epicId');
				if (currentValue !== task.epicId) {
					form.setValue('epicId', task.epicId, { shouldDirty: false });
				}
			}
		}

		// Update sprintId if task has one and sprints are loaded
		if (task.sprintId && sprints && sprints.length > 0) {
			const sprintExists = sprints.some(
				(sprint) => sprint.id === task.sprintId
			);
			if (sprintExists) {
				const currentValue = form.getValues('sprintId');
				if (currentValue !== task.sprintId) {
					form.setValue('sprintId', task.sprintId, { shouldDirty: false });
				}
			}
		}
	}, [task, epics, sprints, form]);

	const onSubmit = async (data: TaskFormData) => {
		console.log('data', data);
		if (isEditing && task) {
			updateTask({
				id: task.id,
				...data,
				isTemplate
			});
		} else {
			createTask({
				...data,
				status: TaskStatusEnum.BACKLOG,
				isTemplate
			} as CreateTaskInput);
		}
		onClose();
	};

	const handleDelete = () => {
		if (task) {
			deleteTask(task.id);
			onClose();
		}
	};

	return (
		<FormProvider {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
								<p className="mt-1 text-destructive text-sm">
									{form.formState.errors.title.message}
								</p>
							)}
						</div>

						{/* Description */}
						<div className="space-y-2">
							<RichText />
							{/* biome-ignore lint/a11y/useValidAriaRole: Clerk Protect component uses role prop for authorization */}
							<Protect role="org:admin">
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={isGeneratingDescription}
									onClick={() => {
										const currentDescription = form.watch('description') || '';
										// Extract plain text from HTML if needed
										const plainText = currentDescription
											.replace(/<[^>]*>/g, '')
											.trim();

										generateTaskDescription(plainText, {
											onSuccess: (generatedText) => {
												// Convert plain text to HTML by wrapping in paragraphs
												// Split by double newlines to create paragraphs, or single newlines for line breaks
												const htmlContent = generatedText
													.split(/\n\s*\n/)
													.map((paragraph) => paragraph.trim())
													.filter((p) => p.length > 0)
													.map((paragraph) => {
														// Replace single newlines within paragraphs with <br> tags
														const withBreaks = paragraph.replace(/\n/g, '<br>');
														return `<p>${withBreaks}</p>`;
													})
													.join('');

												// Update the form description
												form.setValue('description', htmlContent, {
													shouldDirty: true
												});
											}
										});
									}}
								>
									{isGeneratingDescription ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Generating...
										</>
									) : (
										<>
											<Sparkles className="mr-2 h-4 w-4" />
											Generate Task Description
										</>
									)}
								</Button>
							</Protect>
						</div>

						{/* Code Review Request Section */}
						{!isTemplate && (
							<div
								className={cn(
									'rounded-lg border border-epic-border bg-gradient-to-r from-epic-muted to-info-muted p-4',
									!isEditing && 'opacity-50'
								)}
							>
								<div className="space-y-4">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<h3 className="mb-2 font-semibold text-epic-muted-foreground text-sm">
												Need help with this task?
											</h3>
											<p className="mb-3 text-epic-muted-foreground text-sm">
												Get your code reviewed by an experienced mentor. They'll
												provide feedback on your implementation, suggest
												improvements, and help you learn best practices.
											</p>
											<div className="flex items-center gap-2 text-epic text-xs">
												<span>💳 Costs 5 credits</span>
												<span>•</span>
												<span>✨ Free with mentorship plan</span>
											</div>
										</div>
									</div>

									{/* PR URL Input - Always editable when task exists */}
									{isEditing && (
										<div>
											<Label
												htmlFor="prUrl"
												className="mb-2 block text-epic-muted-foreground text-sm"
											>
												Pull Request URL
											</Label>
											<div className="flex gap-2">
												<Input
													id="prUrl"
													type="url"
													value={prUrl}
													onChange={(e) => setPrUrl(e.target.value)}
													placeholder="https://github.com/user/repo/pull/123"
													className="flex-1"
												/>
												{activeReview &&
													prUrl.trim() &&
													prUrl.trim() !== activeReview.prUrl && (
														<Button
															type="button"
															size="sm"
															onClick={() => {
																if (activeReview && prUrl.trim()) {
																	updatePRReviewUrl({
																		reviewId: activeReview.id,
																		prUrl: prUrl.trim()
																	});
																}
															}}
															disabled={isUpdatingPRUrl}
															className="bg-gradient-to-r from-epic to-info text-epic-foreground hover:from-epic/90 hover:to-info/90"
														>
															{isUpdatingPRUrl ? (
																<>
																	<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																	Updating...
																</>
															) : (
																'Update'
															)}
														</Button>
													)}
											</div>
											{activeReview?.prUrl && (
												<p className="mt-1 text-epic-muted-foreground text-xs">
													You can update the PR URL at any time
												</p>
											)}
										</div>
									)}

									{/* Request Code Review Button */}
									{isEditing && taskId && prUrl?.trim() && !activeReview && (
										<div>
											<Button
												type="button"
												onClick={() => {
													const trimmedPrUrl = prUrl.trim();
													if (trimmedPrUrl && taskId) {
														requestCodeReview({
															taskId,
															prUrl: trimmedPrUrl
														});
													}
												}}
												disabled={
													isRequestingCodeReview ||
													!prUrl?.trim() ||
													(!userHasMentorship && userCredits < 5)
												}
												className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
												size="sm"
											>
												{isRequestingCodeReview ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Requesting...
													</>
												) : (
													<>
														{userHasMentorship
															? 'Request Code Review'
															: `Request Code Review (${userCredits >= 5 ? '5 credits' : 'Insufficient credits'})`}
													</>
												)}
											</Button>
											{!userHasMentorship && userCredits < 5 && (
												<p className="mt-2 text-destructive text-xs">
													You need at least 5 credits to request a code review
												</p>
											)}
										</div>
									)}

									{/* PR Review Status */}
									<PullRequest
										taskId={taskId}
										prUrl={prUrl || activeReview?.prUrl}
										isEditing={isEditing}
									/>
								</div>
							</div>
						)}

						{/* Comments - use taskId directly to allow parallel fetching */}
						<TaskComments taskId={taskId || ''} isEditing={!!task} />
					</div>

					{/* Sidebar */}
					<div className="space-y-6 border-border border-l pl-4">
						{/* Status */}
						<div>
							<Label htmlFor="status" className="mb-2 block">
								Status
							</Label>
							<Select
								value={form.watch('status')}
								onValueChange={(value) =>
									form.setValue('status', value as TaskStatusEnum, {
										shouldDirty: true
									})
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
								value={form.watch('priority')}
								onValueChange={(value) =>
									form.setValue('priority', value as TaskPriorityEnum, {
										shouldDirty: true
									})
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
										value === 'none' ? undefined : value,
										{ shouldDirty: true }
									)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select assignee" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">No assignee</SelectItem>
									{isLoadingMembers ? (
										<SelectItem value="loading" disabled>
											Loading members...
										</SelectItem>
									) : (
										projectMembers?.map((member) => (
											<SelectItem key={member.id} value={member.id}>
												{member.name || member.email}
											</SelectItem>
										))
									)}
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
										value && value.trim() !== '' ? new Date(value) : undefined
								})}
							/>
						</div>

						{/* Story Points */}
						<div>
							<Label htmlFor="storyPoints" className="mb-2 block">
								Story Points
							</Label>
							<Input
								id="storyPoints"
								type="number"
								min="1"
								placeholder="e.g. 1, 2, 3, 5, 8, 13, 21"
								{...form.register('storyPoints', {
									setValueAs: (value: string) => {
										const num = Number.parseInt(value, 10);
										return value && !Number.isNaN(num) ? num : undefined;
									}
								})}
							/>
						</div>

						{/* Epic */}
						<FormField
							control={form.control}
							name="epicId"
							render={({ field }) => {
								// Ensure value is a valid string or 'none'
								const selectValue =
									field.value && typeof field.value === 'string'
										? epics?.some((e) => e.id === field.value)
											? field.value
											: 'none'
										: 'none';

								return (
									<FormItem>
										<FormLabel>Epic</FormLabel>
										<Select
											key={`epic-select-${task?.id || 'new'}-${epics?.length || 0}-${selectValue}`}
											value={selectValue}
											onValueChange={(value) =>
												field.onChange(value === 'none' ? undefined : value)
											}
											disabled={epics?.length === 0}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={
															epics?.length === 0
																? 'No epics available'
																: 'Select epic'
														}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">No epic</SelectItem>
												{epics?.map((epic) => (
													<SelectItem key={epic.id} value={epic.id}>
														{epic.title}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormItem>
								);
							}}
						/>

						{/* Sprint */}
						<FormField
							control={form.control}
							name="sprintId"
							render={({ field }) => {
								// Ensure value is a valid string or 'none'
								const selectValue =
									field.value && typeof field.value === 'string'
										? sprints?.some((s) => s.id === field.value)
											? field.value
											: 'none'
										: 'none';

								return (
									<FormItem>
										<FormLabel>Sprint</FormLabel>
										<Select
											key={`sprint-select-${task?.id || 'new'}-${sprints?.length || 0}-${selectValue}`}
											value={selectValue}
											onValueChange={(value) =>
												field.onChange(value === 'none' ? undefined : value)
											}
											disabled={sprints?.length === 0}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={
															sprints?.length === 0
																? 'No sprints available'
																: 'Select sprint'
														}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">No sprint</SelectItem>
												{sprints?.map((sprint) => (
													<SelectItem key={sprint.id} value={sprint.id}>
														{sprint.title}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormItem>
								);
							}}
						/>

						{/* Blocked Status Toggle */}
						<div className="space-y-3 rounded-lg border bg-muted/20 p-4">
							<div className="flex items-center space-x-2">
								<Switch
									id="blocked"
									checked={form.watch('blocked') ?? false}
									onCheckedChange={(checked) => {
										form.setValue('blocked', checked, {
											shouldDirty: true
										});
										if (!checked) {
											form.setValue('blockedReason', undefined, {
												shouldDirty: true
											});
										}
									}}
								/>
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

				<div className="flex justify-between">
					{isEditing && (
						<ConfirmationDialog
							title="Delete Task"
							description={`Are you sure you want to delete "${task?.title}"? This action cannot be undone.`}
							onConfirm={handleDelete}
						>
							<Button
								type="button"
								variant="destructive"
								disabled={form.formState.isSubmitting}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete Task
							</Button>
						</ConfirmationDialog>
					)}
					<div className="ml-auto flex gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={form.formState.isSubmitting}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={form.formState.isSubmitting || !form.formState.isDirty}
						>
							{form.formState.isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{form.formState.isSubmitting
								? isEditing
									? 'Updating...'
									: 'Creating...'
								: isEditing
									? 'Update Task'
									: 'Create Task'}
						</Button>
					</div>
				</div>
			</form>
		</FormProvider>
	);
}
