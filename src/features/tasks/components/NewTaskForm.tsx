import { Input } from '~/common/components/ui/input';

import { zodResolver } from '@hookform/resolvers/zod';
import { TaskPriorityEnum, TaskTypeEnum } from '@prisma/client';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { Button } from '~/common/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '~/common/components/ui/form';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { Textarea } from '~/common/components/ui/textarea';
import { useDialog } from '~/common/hooks/useDialog';
import { useTask } from '../hooks/useTask';
import { createTaskSchema } from '../schemas/task.schema';
import type { CreateTask } from '../types/task.type';

export default function NewTaskForm({
	projectTemplateName
}: {
	projectTemplateName: string;
}) {
	const { createTask } = useTask();
	const { setIsDialogOpen } = useDialog();

	const handleAddTask = async (data: CreateTask) => {
		await createTask.mutateAsync({
			...data,
			tags: data.tags?.split(',')
		});
	};

	const form = useForm<CreateTask>({
		resolver: zodResolver(createTaskSchema),
		defaultValues: {
			projectTemplateName: projectTemplateName
		}
	});

	const onSubmit: SubmitHandler<CreateTask> = async (data: CreateTask) => {
		await handleAddTask(data);
		form.reset();
		setIsDialogOpen(false);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Title</FormLabel>
							<FormControl>
								<Input placeholder="Task title" {...field} />
							</FormControl>
							<ErrorMessage message={form.formState.errors.title?.message} />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea placeholder="Task description" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="type"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Type</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.values(TaskTypeEnum).map((type) => (
											<SelectItem key={type} value={type}>
												{type}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="priority"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Priority</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select priority" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.values(TaskPriorityEnum).map((priority) => (
											<SelectItem key={priority} value={priority}>
												{priority}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="tags"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Tags (comma separated)</FormLabel>
							<FormControl>
								<Input placeholder="feature, bug, enhancement" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex justify-end gap-4">
					<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
						Cancel
					</Button>
					<Button type="submit" disabled={createTask.isPending}>
						Add Task
					</Button>
				</div>
			</form>
		</Form>
	);
}
