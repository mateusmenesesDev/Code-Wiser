'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ExerciseChallengeDifficulty } from '@prisma/client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { DIFFICULTY_LABELS } from '../lib/difficulty';

const formSchema = z.object({
	title: z.string().trim().min(1, 'Title is required'),
	difficulty: z.nativeEnum(ExerciseChallengeDifficulty),
	description: z.string().trim().min(1, 'Description is required'),
	setupInstructions: z.string().trim().min(1, 'Setup instructions are required'),
	acceptanceCriteria: z
		.string()
		.trim()
		.min(1, 'Acceptance criteria are required'),
	sortOrder: z.number().int().min(0).optional()
});

type FormValues = z.infer<typeof formSchema>;

type ChallengeFormDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: FormValues) => Promise<void> | void;
	isSubmitting?: boolean;
	initialValues?: Partial<FormValues>;
	mode: 'create' | 'edit';
};

export function ChallengeFormDialog({
	open,
	onOpenChange,
	onSubmit,
	isSubmitting,
	initialValues,
	mode
}: ChallengeFormDialogProps) {
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: '',
			difficulty: ExerciseChallengeDifficulty.EASY,
			description: '',
			setupInstructions: '',
			acceptanceCriteria: '',
			sortOrder: 0
		}
	});

	useEffect(() => {
		if (!open) return;
		form.reset({
			title: initialValues?.title ?? '',
			difficulty: initialValues?.difficulty ?? ExerciseChallengeDifficulty.EASY,
			description: initialValues?.description ?? '',
			setupInstructions: initialValues?.setupInstructions ?? '',
			acceptanceCriteria: initialValues?.acceptanceCriteria ?? '',
			sortOrder: initialValues?.sortOrder ?? 0
		});
	}, [open, initialValues, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{mode === 'create' ? 'Create challenge' : 'Edit challenge'}
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
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input placeholder="Counter App" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="difficulty"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Difficulty</FormLabel>
									<Select value={field.value} onValueChange={field.onChange}>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.values(ExerciseChallengeDifficulty).map(
												(difficulty) => (
													<SelectItem key={difficulty} value={difficulty}>
														{DIFFICULTY_LABELS[difficulty]}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
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
										<Textarea rows={4} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="setupInstructions"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Setup instructions</FormLabel>
									<FormControl>
										<Textarea rows={4} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="acceptanceCriteria"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Acceptance criteria</FormLabel>
									<FormControl>
										<Textarea rows={4} {...field} />
									</FormControl>
									<FormMessage />
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
