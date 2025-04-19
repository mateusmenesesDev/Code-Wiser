import { zodResolver } from '@hookform/resolvers/zod';
import type { Task } from '@prisma/client';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { Avatar, AvatarFallback } from '~/common/components/ui/avatar';
import { Button } from '~/common/components/ui/button';
import { Calendar } from '~/common/components/ui/calendar';
import {
	Dialog,
	DialogContent,
	DialogTrigger
} from '~/common/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '~/common/components/ui/form';
import { Input } from '~/common/components/ui/input';
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/common/components/ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { Switch } from '~/common/components/ui/switch';
import { Textarea } from '~/common/components/ui/textarea';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';
import { useTask } from '../hooks/useTask';
import { createTaskSchema, updateTaskSchema } from '../schemas/task.schema';
import type { CreateTaskInput, UpdateTaskInput } from '../types/task.type';

dayjs.extend(localizedFormat);

type TaskDialogProps = {
	task?: Task;
	trigger?: React.ReactNode;
	isTemplate: boolean;
	projectSlug: string;
};

// Use discriminated union type
type FormData = CreateTaskInput | UpdateTaskInput;

export function TaskDialog({
	task,
	trigger,
	isTemplate,
	projectSlug
}: TaskDialogProps) {
	const [open, setOpen] = useState(false);
	const { createTask, updateTask } = useTask({
		isTemplate,
		projectSlug
	});

	const form = useForm<FormData>({
		resolver: zodResolver(task ? updateTaskSchema : createTaskSchema),
		defaultValues: {
			title: task?.title ?? '',
			description: task?.description ?? '',
			tags: task?.tags,
			sprintId: task?.sprintId ?? undefined,
			epicId: task?.epicId ?? undefined,
			blocked: task?.blocked ?? false,
			blockedReason: task?.blockedReason ?? '',
			assigneeId: task?.assigneeId ?? undefined,
			status: task?.status ?? 'BACKLOG',
			storyPoints: task?.storyPoints ?? undefined,
			dueDate: task?.dueDate ?? undefined,
			projectTemplateSlug: isTemplate ? projectSlug : undefined,
			projectSlug: isTemplate ? undefined : projectSlug
		}
	});

	const onSubmit: SubmitHandler<FormData> = (data) => {
		if (task) {
			updateTask({
				taskId: task.id,
				...data
			});
		} else {
			createTask({
				...data,
				title: data.title ?? '',
				projectTemplateSlug: isTemplate ? projectSlug : undefined,
				projectSlug: isTemplate ? undefined : projectSlug
			});
		}
		form.reset();
		setOpen(false);
	};

	const sprints = isTemplate
		? api.sprint.getAllByProjectTemplateSlug.useQuery(
				{
					projectTemplateSlug: projectSlug
				},
				{ enabled: isTemplate }
			)
		: api.sprint.getAllByProjectSlug.useQuery(
				{
					projectSlug: projectSlug
				},
				{ enabled: !isTemplate }
			);

	const epics = isTemplate
		? api.epic.getAllEpicsByProjectTemplateSlug.useQuery(
				{
					projectTemplateSlug: projectSlug
				},
				{ enabled: isTemplate }
			)
		: api.epic.getAllEpicsByProjectId.useQuery(
				{
					projectId: projectSlug
				},
				{ enabled: !isTemplate }
			);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="max-h-[90vh] sm:max-w-[800px]">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Header with Title */}
						<div className="space-y-4">
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Input
												{...field}
												className="border-0 bg-transparent font-semibold text-xl placeholder:text-muted-foreground/50 focus-visible:ring-0"
												placeholder="Task title"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-5 gap-6">
							{/* Main Content - Left Column */}
							<div className="col-span-3 space-y-4">
								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-medium text-muted-foreground text-sm">
												Description
											</FormLabel>
											<FormControl>
												<Textarea
													{...field}
													rows={12}
													className="resize-none"
													value={field.value ?? ''}
													placeholder="Add a description..."
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{form.watch('blocked') && (
									<FormField
										control={form.control}
										name="blockedReason"
										render={({ field }) => (
											<FormItem className="rounded-md border border-destructive/50 bg-destructive/5 p-4">
												<FormLabel className="font-medium text-destructive text-sm">
													Blocked Reason
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														value={field.value ?? ''}
														placeholder="Why is this task blocked?"
														className="resize-none border-destructive/20"
														rows={3}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
							</div>

							{/* Sidebar - Right Column */}
							<div className="col-span-2 space-y-6">
								<div className="space-y-4">
									{!isTemplate && (
										<FormField
											control={form.control}
											name="assigneeId"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="font-medium text-muted-foreground text-sm">
														Assignee
													</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value || 'none'}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Unassigned" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="none">
																<div className="flex items-center gap-2">
																	<Avatar className="h-6 w-6">
																		<AvatarFallback>UN</AvatarFallback>
																	</Avatar>
																	Unassigned
																</div>
															</SelectItem>
															{/* TODO: Add users */}
															{/* {users?.map((user) => (
															<SelectItem key={user.id} value={user.id}>
																<div className="flex items-center gap-2">
																	<Avatar className="h-6 w-6">
																		<AvatarImage src={user.image} />
																		<AvatarFallback>
																			{user.name.substring(0, 2).toUpperCase()}
																		</AvatarFallback>
																	</Avatar>
																	{user.name}
																</div>
															</SelectItem>
														))} */}
														</SelectContent>
													</Select>
												</FormItem>
											)}
										/>
									)}
									{!isTemplate && (
										<FormField
											control={form.control}
											name="dueDate"
											render={({ field }) => (
												<FormItem className="flex flex-col">
													<FormLabel>Due Date</FormLabel>
													<Popover>
														<PopoverTrigger asChild>
															<FormControl>
																<Button
																	variant={'outline'}
																	className={cn(
																		'w-[240px] pl-3 text-left font-normal',
																		!field.value && 'text-muted-foreground'
																	)}
																>
																	{field.value ? (
																		dayjs(field.value).format('MMM D, YYYY')
																	) : (
																		<span>Pick a date</span>
																	)}
																	<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
																</Button>
															</FormControl>
														</PopoverTrigger>
														<PopoverContent
															className="w-auto p-0"
															align="start"
														>
															<Calendar
																mode="single"
																selected={
																	field.value
																		? new Date(field.value)
																		: undefined
																}
																onSelect={field.onChange}
																disabled={(date) =>
																	date > new Date() ||
																	date < new Date('1900-01-01')
																}
																initialFocus
															/>
														</PopoverContent>
													</Popover>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}
									<FormField
										control={form.control}
										name="status"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-medium text-muted-foreground text-sm">
													Status
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value ?? 'BACKLOG'}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue>
																<div className="flex items-center gap-2">
																	<div
																		className={cn(
																			'h-2 w-2 rounded-full',
																			field.value === 'BACKLOG' &&
																				'bg-slate-500',
																			field.value === 'IN_PROGRESS' &&
																				'bg-yellow-500',
																			field.value === 'CODE_REVIEW' &&
																				'bg-purple-500',
																			field.value === 'UAT' && 'bg-purple-500',
																			field.value === 'DONE' && 'bg-green-500'
																		)}
																	/>
																	{field.value?.replace(/_/g, ' ')}
																</div>
															</SelectValue>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{[
															{ value: 'BACKLOG', color: 'bg-slate-500' },
															{ value: 'TODO', color: 'bg-blue-500' },
															{ value: 'IN_PROGRESS', color: 'bg-yellow-500' },
															{ value: 'IN_REVIEW', color: 'bg-purple-500' },
															{ value: 'DONE', color: 'bg-green-500' }
														].map((status) => (
															<SelectItem
																key={status.value}
																value={status.value}
															>
																<div className="flex items-center gap-2">
																	<div
																		className={cn(
																			'h-2 w-2 rounded-full',
																			status.color
																		)}
																	/>
																	{status.value.replace(/_/g, ' ')}
																</div>
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
										name="storyPoints"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-medium text-muted-foreground text-sm">
													Story Points
												</FormLabel>
												<Select
													onValueChange={(value) =>
														field.onChange(
															value === 'none' ? null : Number(value)
														)
													}
													value={field.value?.toString() || 'none'}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="No estimate" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="none">No estimate</SelectItem>
														{[1, 2, 3, 5, 8, 13, 21].map((points) => (
															<SelectItem
																key={points}
																value={points.toString()}
															>
																{points} {points === 1 ? 'point' : 'points'}
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
										name="sprintId"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-medium text-muted-foreground text-sm">
													Sprint
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value || 'none'}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="No Sprint" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="none">No Sprint</SelectItem>
														{sprints.data?.map((sprint) => (
															<SelectItem key={sprint.id} value={sprint.id}>
																{sprint.title}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="epicId"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-medium text-muted-foreground text-sm">
													Epic
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value || 'none'}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="No Epic" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="none">No Epic</SelectItem>
														{epics.data?.map((epic) => (
															<SelectItem key={epic.id} value={epic.id}>
																{epic.title}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="tags"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-medium text-muted-foreground text-sm">
													Tags
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														placeholder="Enter tags..."
														className="text-sm"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="blocked"
										render={({ field }) => (
											<FormItem>
												<div className="flex items-center gap-2">
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
													<FormLabel className="font-medium text-sm">
														Task is blocked
													</FormLabel>
												</div>
											</FormItem>
										)}
									/>
								</div>
							</div>
						</div>

						{/* Footer */}
						<div className="flex items-center justify-end gap-2 border-t pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
							>
								Cancel
							</Button>
							<Button type="submit">
								{task ? 'Save Changes' : 'Create Task'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
