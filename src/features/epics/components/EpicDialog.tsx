'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '~/common/components/ui/textarea';
import { useDialog } from '~/common/hooks/useDialog';
import { useEpicMutations } from '../hooks/useEpicMutations';
import { newEpicSchema } from '../schemas/epics.schema';
import type { EpicApiOutput, EpicInput } from '../types/Epic.type';

interface EpicDialogProps {
	projectId: string;
	epic?: EpicApiOutput;
	isTemplate?: boolean;
}

export default function EpicDialog({
	projectId,
	epic,
	isTemplate = false
}: EpicDialogProps) {
	const form = useForm<EpicInput>({
		resolver: zodResolver(newEpicSchema)
	});

	const { createEpic, updateEpic } = useEpicMutations({ projectId });

	const { closeDialog, isDialogOpen } = useDialog('epic');

	const isEditing = !!epic;

	useEffect(() => {
		if (epic) {
			form.reset({
				title: epic.title,
				description: epic.description || '',
				projectId: projectId,
				isTemplate: isTemplate
			});
		} else {
			form.reset({
				title: '',
				description: '',
				projectId: projectId,
				isTemplate: isTemplate
			});
		}
	}, [epic, form, projectId, isTemplate]);

	const onSubmit = (values: EpicInput) => {
		if (isEditing && epic) {
			updateEpic.mutate({
				id: epic.id,
				title: values.title,
				description: values.description
			});
		} else {
			createEpic.mutate({
				title: values.title,
				description: values.description,
				projectId: projectId,
				isTemplate: isTemplate
			});
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
									<FormLabel>Epic Title</FormLabel>
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
