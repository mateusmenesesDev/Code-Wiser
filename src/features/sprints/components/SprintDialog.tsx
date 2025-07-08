import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { Button } from '~/common/components/ui/button';
import {
	DialogContent,
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
import { useDialog } from '~/common/hooks/useDialog';
import { useSprintMutations } from '../hooks/useSprintMutations';
import { newSprintSchema } from '../schemas/sprint.schema';
import type { NewSprint, SprintApiOutput } from '../types/Sprint.type';

interface SprintDialogProps {
	projectId: string;
	sprint?: SprintApiOutput | null;
	isTemplate?: boolean;
	onCancel: () => void;
}

export default function SprintDialog({
	projectId,
	sprint,
	isTemplate = false,
	onCancel
}: SprintDialogProps) {
	const { createSprint, updateSprint } = useSprintMutations({ projectId });
	const { closeDialog } = useDialog('sprint');

	const form = useForm<NewSprint>({
		resolver: zodResolver(newSprintSchema),
		defaultValues: {
			title: '',
			description: '',
			projectId,
			isTemplate
		}
	});

	useEffect(() => {
		if (sprint) {
			form.reset({
				title: sprint.title,
				description: sprint.description || '',
				projectId: sprint.projectId || projectId,
				isTemplate
			});
		} else {
			form.reset({
				title: '',
				description: '',
				projectId,
				isTemplate
			});
		}
	}, [sprint, form, projectId, isTemplate]);

	const onSubmit: SubmitHandler<NewSprint> = async (data) => {
		closeDialog();
		if (sprint) {
			await updateSprint.mutateAsync({
				id: sprint.id,
				...data
			});
		} else {
			await createSprint.mutateAsync(data);
		}
		onCancel();
	};

	const isPending = createSprint.isPending || updateSprint.isPending;

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>
					{sprint ? 'Edit Sprint' : 'Create New Sprint'}
				</DialogTitle>
			</DialogHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Sprint Title</FormLabel>
								<FormControl>
									<Input
										placeholder="e.g., Sprint 1: Project Setup"
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
										placeholder="Sprint goals and objectives"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isPending}
							className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
						>
							{isPending
								? 'Saving...'
								: sprint
									? 'Update Sprint'
									: 'Create Sprint'}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
}
