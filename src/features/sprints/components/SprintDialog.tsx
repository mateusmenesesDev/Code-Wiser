import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { api } from '~/trpc/react';

const sprintFormSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string().optional()
});

type SprintFormData = z.infer<typeof sprintFormSchema>;

interface SprintDialogProps {
	projectId: string;
	sprintId: string | null;
	onSuccess: () => void;
	onCancel: () => void;
}

export default function SprintDialog({
	projectId,
	sprintId,
	onSuccess,
	onCancel
}: SprintDialogProps) {
	const { data: sprint } = api.sprint.getById.useQuery(
		{ id: sprintId || '' },
		{ enabled: !!sprintId }
	);

	const form = useForm<SprintFormData>({
		resolver: zodResolver(sprintFormSchema),
		defaultValues: {
			title: '',
			description: ''
		}
	});

	// Update form when sprint data is loaded
	useEffect(() => {
		if (sprint) {
			form.reset({
				title: sprint.title,
				description: sprint.description || ''
			});
		}
	}, [sprint, form]);

	const createSprintMutation = api.sprint.create.useMutation({
		onSuccess: () => {
			toast.success('Sprint created successfully');
			onSuccess();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to create sprint');
		}
	});

	const updateSprintMutation = api.sprint.update.useMutation({
		onSuccess: () => {
			toast.success('Sprint updated successfully');
			onSuccess();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to update sprint');
		}
	});

	const onSubmit = (data: SprintFormData) => {
		if (sprintId) {
			updateSprintMutation.mutate({
				id: sprintId,
				...data
			});
		} else {
			createSprintMutation.mutate({
				...data,
				projectId
			});
		}
	};

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>
					{sprintId ? 'Edit Sprint' : 'Create New Sprint'}
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
							disabled={
								createSprintMutation.isPending || updateSprintMutation.isPending
							}
						>
							{createSprintMutation.isPending || updateSprintMutation.isPending
								? 'Saving...'
								: sprintId
									? 'Update Sprint'
									: 'Create Sprint'}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
}
