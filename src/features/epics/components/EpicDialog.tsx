'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { EpicStatusEnum } from '@prisma/client';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '~/common/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { Textarea } from '~/common/components/ui/textarea';
import { useDialog } from '~/common/hooks/useDialog';
import { useEpicMutations } from '../hooks/useEpicMutations';
import { newEpicSchema } from '../schemas/epics.schema';
import type { EpicApiOutput, EpicInput } from '../types/Epic.type';

interface EpicDialogProps {
	projectId: string;
	epic?: EpicApiOutput | null;
	isTemplate?: boolean;
}

const epicStatusLabel = (status: EpicStatusEnum) =>
	status === EpicStatusEnum.IN_PROGRESS
		? 'In progress'
		: status.charAt(0) + status.slice(1).toLowerCase();

export default function EpicDialog({
	projectId,
	epic,
	isTemplate = false
}: EpicDialogProps) {
	const form = useForm<EpicInput>({
		resolver: zodResolver(newEpicSchema),
		defaultValues: {
			title: '',
			description: '',
			status: EpicStatusEnum.PLANNED,
			startDate: '',
			endDate: '',
			projectId,
			isTemplate
		}
	});

	const { createEpic, updateEpic } = useEpicMutations({ projectId });
	const { closeDialog, isDialogOpen } = useDialog('epic');
	const isEditing = !!epic;

	useEffect(() => {
		if (epic) {
			form.reset({
				title: epic.title,
				description: epic.description || '',
				status: epic.status ?? EpicStatusEnum.PLANNED,
				startDate: epic.startDate
					? dayjs(epic.startDate).format('YYYY-MM-DD')
					: '',
				endDate: epic.endDate ? dayjs(epic.endDate).format('YYYY-MM-DD') : '',
				projectId,
				isTemplate
			});
			return;
		}

		form.reset({
			title: '',
			description: '',
			status: EpicStatusEnum.PLANNED,
			startDate: '',
			endDate: '',
			projectId,
			isTemplate
		});
	}, [epic, form, projectId, isTemplate]);

	const onSubmit = (values: EpicInput) => {
		if (isEditing && epic) {
			updateEpic.mutate({
				id: epic.id,
				title: values.title,
				description: values.description,
				status: values.status,
				startDate: values.startDate,
				endDate: values.endDate
			});
		} else {
			createEpic.mutate(values);
		}

		closeDialog();
		form.reset();
	};

	const isPending = createEpic.isPending || updateEpic.isPending;

	return (
		<Dialog open={isDialogOpen} onOpenChange={closeDialog}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEditing ? 'Edit Epic' : 'Create New Epic'}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? 'Update the epic details'
							: 'Add a new epic to organize related tasks and features'}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Epic title</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g., User Authentication System"
											{...field}
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
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Describe the epic goals and features"
											rows={3}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="status"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Status</FormLabel>
									<Select
										value={field.value ?? EpicStatusEnum.PLANNED}
										onValueChange={field.onChange}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.values(EpicStatusEnum).map((status) => (
												<SelectItem key={status} value={status}>
													{epicStatusLabel(status)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="startDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Start date</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="endDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>End date</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={closeDialog}>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isPending}
								className="bg-epic text-epic-foreground hover:bg-epic/90"
							>
								{isPending
									? 'Saving...'
									: isEditing
										? 'Update Epic'
										: 'Create Epic'}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
