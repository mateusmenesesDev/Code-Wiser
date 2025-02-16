'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { useParams } from 'next/navigation';
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
import { Textarea } from '~/common/components/ui/textarea';
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import { useSprint } from '../../hooks/sprint.hook';
import { newSprintSchema } from '../../schemas/sprint.schema';
import type { NewSprint } from '../../types/Sprint.type';

type NewSprintDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function NewSprintDialog({ open, onOpenChange }: NewSprintDialogProps) {
	const isTemplate = useIsTemplate();
	const params = useParams();
	const projectSlug = decodeURIComponent(params.slug as string);

	const { createSprint } = useSprint({
		projectSlug: projectSlug,
		isTemplate: isTemplate
	});
	const form = useForm<NewSprint>({
		resolver: zodResolver(newSprintSchema),
		defaultValues: {
			projectSlug: isTemplate ? undefined : projectSlug,
			projectTemplateSlug: isTemplate ? projectSlug : undefined
		}
	});

	console.log(form.formState.errors);

	const onSubmit = (data: NewSprint) => {
		console.log('this is the data', data);
		createSprint.mutate({
			...data,
			projectSlug: isTemplate ? undefined : projectSlug,
			projectTemplateSlug: isTemplate ? projectSlug : undefined,
			startDate: data.startDate
				? dayjs(data.startDate).format('YYYY-MM-DD')
				: undefined,
			endDate: data.endDate
				? dayjs(data.endDate).format('YYYY-MM-DD')
				: undefined
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Sprint</DialogTitle>
					<DialogDescription>
						Add a new sprint to your project
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input {...field} />
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
									<FormLabel>Goal (Optional)</FormLabel>
									<FormControl>
										<Textarea {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{!isTemplate && (
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="startDate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Start Date</FormLabel>
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
											<FormLabel>End Date</FormLabel>
											<FormControl>
												<Input type="date" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}
						<DialogFooter>
							<Button type="submit">Create Sprint</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
