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
import { newEpicSchema } from '~/features/epics/schemas/epics.schema';
import type { EpicInput } from '~/features/epics/types/Epic.type';
import { useTemplate } from '~/features/templates/hook/useTemplate';

interface NewEpicDialogProps {
	isOpen: boolean;
	onClose: () => void;
	projectId: string;
}

export function NewEpicDialog({
	isOpen,
	onClose,
	projectId
}: NewEpicDialogProps) {
	const form = useForm<EpicInput>({
		resolver: zodResolver(newEpicSchema)
	});

	useEffect(() => {
		form.reset({
			projectTemplateId: projectId
		});
	}, [form, projectId]);

	const { createEpic } = useTemplate();

	const onSubmit = (values: EpicInput) => {
		createEpic.mutate({
			title: values.title,
			description: values.description,
			projectTemplateId: projectId
		});
		onClose();
		form.reset();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Epic</DialogTitle>
					<DialogDescription>
						Add a new epic to organize related tasks
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
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button type="submit">Create Epic</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
