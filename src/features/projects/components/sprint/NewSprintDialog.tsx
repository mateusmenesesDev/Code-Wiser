'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '~/common/components/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '~/common/components/form';
import { Input } from '~/common/components/input';
import { Textarea } from '~/common/components/textarea';

const sprintSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	goal: z.string().optional(),
	startDate: z.string().min(1, 'Start date is required'),
	endDate: z.string().min(1, 'End date is required')
});

type SprintFormValues = z.infer<typeof sprintSchema>;

interface NewSprintDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function NewSprintDialog({ open, onOpenChange }: NewSprintDialogProps) {
	const form = useForm<SprintFormValues>({
		resolver: zodResolver(sprintSchema),
		defaultValues: {
			title: '',
			goal: '',
			startDate: '',
			endDate: ''
		}
	});

	const onSubmit = (data: SprintFormValues) => {
		console.log(data);
		onOpenChange(false);
		form.reset();
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
							name="goal"
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
						<DialogFooter>
							<Button type="submit">Create Sprint</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
