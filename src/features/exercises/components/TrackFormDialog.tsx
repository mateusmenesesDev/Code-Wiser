'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '~/common/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '~/common/components/ui/form';
import { Input } from '~/common/components/ui/input';
import { Switch } from '~/common/components/ui/switch';
import { Textarea } from '~/common/components/ui/textarea';
import { createExerciseTrackSchema } from '../schemas/exercise.schema';

const formSchema = createExerciseTrackSchema;

type FormValues = z.infer<typeof formSchema>;

type TrackFormDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: FormValues) => Promise<void> | void;
	isSubmitting?: boolean;
	initialValues?: Partial<FormValues> & { id?: string };
	mode: 'create' | 'edit';
};

export function TrackFormDialog({
	open,
	onOpenChange,
	onSubmit,
	isSubmitting,
	initialValues,
	mode
}: TrackFormDialogProps) {
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			description: '',
			repoUrl: '',
			sortOrder: 0,
			isPublished: false
		}
	});

	useEffect(() => {
		if (!open) return;
		form.reset({
			name: initialValues?.name ?? '',
			description: initialValues?.description ?? '',
			repoUrl: initialValues?.repoUrl ?? '',
			slug: initialValues?.slug,
			sortOrder: initialValues?.sortOrder ?? 0,
			isPublished: initialValues?.isPublished ?? false
		});
	}, [open, initialValues, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{mode === 'create' ? 'Create track' : 'Edit track'}
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						className="space-y-4"
						onSubmit={form.handleSubmit(async (values) => {
							await onSubmit(values);
						})}
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="React" {...field} />
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
										<Textarea rows={3} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="repoUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>GitHub repository URL</FormLabel>
									<FormControl>
										<Input
											placeholder="https://github.com/org/react-exercises"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Leave empty until the cloneable repo is ready. Without a
										URL, the track will not show clone instructions.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="sortOrder"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Sort order</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={0}
											value={field.value ?? 0}
											onChange={(e) =>
												field.onChange(Number(e.target.value) || 0)
											}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="isPublished"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between rounded-md border p-3">
									<div>
										<FormLabel>Published</FormLabel>
										<FormDescription>
											Published tracks appear in the public catalog when not
											archived.
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value ?? false}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{mode === 'create' ? 'Create' : 'Save'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
