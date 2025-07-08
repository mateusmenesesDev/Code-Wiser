'use client';

import { TaskPriorityEnum, TaskStatusEnum } from '@prisma/client';
import type { UseFormReturn } from 'react-hook-form';
import {
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
import type { CreateTaskInput } from '~/features/workspace/types/Task.type';
import type { RouterOutputs } from '~/trpc/react';

interface TaskFormFieldsProps {
	form: UseFormReturn<CreateTaskInput>;
	epics: RouterOutputs['epic']['getAllEpicsByProjectTemplateId'];
	sprints: RouterOutputs['sprint']['getAllByProjectId'];
}

export function TaskFormFields({ form, epics, sprints }: TaskFormFieldsProps) {
	return (
		<>
			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="priority"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Priority</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value={TaskPriorityEnum.LOWEST}>
										Lowest
									</SelectItem>
									<SelectItem value={TaskPriorityEnum.LOW}>Low</SelectItem>
									<SelectItem value={TaskPriorityEnum.MEDIUM}>
										Medium
									</SelectItem>
									<SelectItem value={TaskPriorityEnum.HIGH}>High</SelectItem>
									<SelectItem value={TaskPriorityEnum.HIGHEST}>
										Highest
									</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="status"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Initial Status</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value={TaskStatusEnum.BACKLOG}>
										Backlog
									</SelectItem>
									<SelectItem value={TaskStatusEnum.READY_TO_DEVELOP}>
										Ready to Develop
									</SelectItem>
									<SelectItem value={TaskStatusEnum.IN_PROGRESS}>
										In Progress
									</SelectItem>
									<SelectItem value={TaskStatusEnum.CODE_REVIEW}>
										Code Review
									</SelectItem>
									<SelectItem value={TaskStatusEnum.TESTING}>
										Testing
									</SelectItem>
									<SelectItem value={TaskStatusEnum.DONE}>Done</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="epicId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Epic</FormLabel>
							<Select
								onValueChange={(value) =>
									field.onChange(value === 'none' ? undefined : value)
								}
								defaultValue={field.value || 'none'}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select epic (optional)" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="none">No Epic</SelectItem>
									{epics.map((epic) => (
										<SelectItem key={epic.id} value={epic.id}>
											{epic.title}
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
							<FormLabel>Sprint</FormLabel>
							<Select
								onValueChange={(value) =>
									field.onChange(value === 'none' ? undefined : value)
								}
								defaultValue={field.value || 'none'}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select sprint (optional)" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="none">No Sprint</SelectItem>
									{sprints.map((sprint) => (
										<SelectItem key={sprint.id} value={sprint.id}>
											{sprint.title}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</>
	);
}
