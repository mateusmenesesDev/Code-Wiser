'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { TaskPriorityEnum, TaskStatusEnum } from '@prisma/client';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '~/common/components/ui/form';
import { Input } from '~/common/components/ui/input';
import { Textarea } from '~/common/components/ui/textarea';
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import { useTask } from '~/features/workspace/hooks/useTask';
import { createTaskSchema } from '~/features/workspace/schemas/task.schema';
import type { CreateTaskInput } from '~/features/workspace/types/Task.type';
import type { RouterOutputs } from '~/trpc/react';
import { TaskFormFields } from './TaskFormFields';
import { TaskTagsInput, type TaskTagsInputRef } from './TaskTagsInput';

interface CreateTaskFormProps {
	epics: RouterOutputs['epic']['getAllEpicsByProjectTemplateId'];
	sprints: RouterOutputs['sprint']['getAllByProjectId'];
	projectId?: string;
	onSuccess?: () => void;
}

export function CreateTaskForm({
	epics,
	sprints,
	projectId,
	onSuccess
}: CreateTaskFormProps) {
	const tagsRef = useRef<TaskTagsInputRef>(null);

	const { createTask } = useTask({ projectId });
	const isTemplate = useIsTemplate();

	const form = useForm<CreateTaskInput>({
		resolver: zodResolver(createTaskSchema),
		defaultValues: {
			title: '',
			description: '',
			priority: TaskPriorityEnum.MEDIUM,
			status: TaskStatusEnum.BACKLOG,
			tags: [],
			blocked: false,
			blockedReason: '',
			epicId: undefined,
			sprintId: undefined,
			projectId: isTemplate ? undefined : projectId,
			projectTemplateId: isTemplate ? projectId : undefined
		}
	});

	const handleSubmit = (data: CreateTaskInput) => {
		const tags = tagsRef.current?.getTags() || [];
		const taskData = {
			...data,
			tags,
			projectId: isTemplate ? undefined : projectId,
			projectTemplateId: isTemplate ? projectId : undefined
		};

		toast.promise(
			new Promise((resolve, reject) => {
				try {
					createTask(taskData);
					resolve(taskData);
					onSuccess?.();
				} catch (error) {
					reject(error);
				}
			}),
			{
				loading: 'Creating task...',
				success: 'Task created successfully',
				error: 'Failed to create task'
			}
		);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="font-semibold text-base">
								Summary *
							</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter a brief summary of the task"
									className="text-base"
									{...field}
									required
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="font-semibold text-base">
								Description
							</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Describe the task in detail. You can use markdown formatting for better readability."
									rows={8}
									className="min-h-[200px] resize-y text-base"
									{...field}
								/>
							</FormControl>
							<FormMessage />
							<p className="text-muted-foreground text-sm">
								Tip: Use markdown for formatting (e.g., **bold**, *italic*,
								`code`)
							</p>
						</FormItem>
					)}
				/>

				<TaskFormFields form={form} epics={epics} sprints={sprints} />

				<div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
					<h3 className="font-semibold text-base">Blocking Status</h3>

					<FormField
						control={form.control}
						name="blocked"
						render={({ field }) => (
							<FormItem className="flex flex-row items-center space-x-3 space-y-0">
								<FormControl>
									<input
										type="checkbox"
										className="h-4 w-4 rounded border-gray-300"
										checked={field.value}
										onChange={field.onChange}
									/>
								</FormControl>
								<div className="space-y-1 leading-none">
									<FormLabel className="font-medium text-sm">
										This task is blocked
									</FormLabel>
									<p className="text-muted-foreground text-xs">
										Check this if the task cannot proceed due to dependencies or
										issues
									</p>
								</div>
							</FormItem>
						)}
					/>

					{form.watch('blocked') && (
						<FormField
							control={form.control}
							name="blockedReason"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-medium text-sm">
										Blocked Reason *
									</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Explain why this task is blocked and what needs to be resolved..."
											rows={3}
											className="text-sm"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}
				</div>

				<TaskTagsInput ref={tagsRef} />

				<div className="flex gap-3 border-t pt-6">
					<Button
						type="button"
						variant="outline"
						onClick={() => onSuccess?.()}
						className="flex-1"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						className="flex-1 bg-blue-600 hover:bg-blue-700"
					>
						Create Task
					</Button>
				</div>
			</form>
		</Form>
	);
}
