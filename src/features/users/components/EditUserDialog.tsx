'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '~/common/components/ui/button';
import {
	Dialog,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { api } from '~/trpc/react';

const editUserSchema = z.object({
	credits: z.number().int().min(0).optional(),
	mentorshipStatus: z.enum(['ACTIVE', 'INACTIVE']).optional(),
	mentorshipType: z
		.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL'])
		.nullable()
		.optional(),
	mentorshipStartDate: z.string().nullable().optional(),
	mentorshipEndDate: z.string().nullable().optional(),
	weeklyMentorshipSessions: z.number().int().min(1).max(3).optional()
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
	userId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUserUpdated: () => void;
}

export function EditUserDialog({
	userId,
	open,
	onOpenChange,
	onUserUpdated
}: EditUserDialogProps) {
	const utils = api.useUtils();
	const { data: user, isLoading } = api.user.getById.useQuery(userId, {
		enabled: open && !!userId
	});

	const updateUserMutation = api.user.update.useMutation({
		onSuccess: async () => {
			toast.success('User updated successfully');
			// Invalidate queries to refresh the UI
			await utils.user.listAll.invalidate();
			await utils.user.getById.invalidate(userId);
			onUserUpdated();
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(`Failed to update user: ${error.message}`);
		}
	});

	const resetSessionsMutation = api.user.resetUserWeeklySessions.useMutation({
		onSuccess: async () => {
			toast.success('Weekly sessions reset successfully');
			// Invalidate queries to refresh the UI
			await utils.user.listAll.invalidate();
			await utils.user.getById.invalidate(userId);
			onUserUpdated();
		},
		onError: (error) => {
			toast.error(`Failed to reset sessions: ${error.message}`);
		}
	});

	const form = useForm<EditUserFormData>({
		resolver: zodResolver(editUserSchema),
		defaultValues: {
			credits: undefined,
			mentorshipStatus: undefined,
			mentorshipType: null,
			mentorshipStartDate: null,
			mentorshipEndDate: null,
			weeklyMentorshipSessions: undefined
		}
	});

	useEffect(() => {
		if (user) {
			form.reset({
				credits: user.credits,
				mentorshipStatus: user.mentorshipStatus,
				mentorshipType: user.mentorshipType ?? null,
				mentorshipStartDate: user.mentorshipStartDate
					? new Date(user.mentorshipStartDate).toISOString().split('T')[0]
					: null,
				mentorshipEndDate: user.mentorshipEndDate
					? new Date(user.mentorshipEndDate).toISOString().split('T')[0]
					: null,
				weeklyMentorshipSessions: user.weeklyMentorshipSessions
			});
		}
	}, [user, form]);

	const onSubmit = (data: EditUserFormData) => {
		updateUserMutation.mutate({
			id: userId,
			credits: data.credits,
			mentorshipStatus: data.mentorshipStatus,
			mentorshipType: data.mentorshipType ?? undefined,
			mentorshipStartDate: data.mentorshipStartDate
				? new Date(data.mentorshipStartDate)
				: null,
			mentorshipEndDate: data.mentorshipEndDate
				? new Date(data.mentorshipEndDate)
				: null,
			weeklyMentorshipSessions: data.weeklyMentorshipSessions
		});
	};

	if (isLoading) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<div className="p-8 text-center">
						<div className="mx-auto h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
						<p className="mt-2 text-muted-foreground">Loading user data...</p>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Edit User</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="credits"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Credits</FormLabel>
										<FormControl>
											<Input
												type="number"
												{...field}
												value={field.value ?? ''}
												onChange={(e) =>
													field.onChange(
														e.target.value
															? Number.parseInt(e.target.value, 10)
															: undefined
													)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="mentorshipStatus"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Mentorship Status</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select status" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="ACTIVE">Active</SelectItem>
												<SelectItem value="INACTIVE">Inactive</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="mentorshipType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Mentorship Type</FormLabel>
										<Select
											onValueChange={(value) =>
												field.onChange(value === 'none' ? null : value)
											}
											value={field.value ?? 'none'}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">None</SelectItem>
												<SelectItem value="MONTHLY">Monthly</SelectItem>
												<SelectItem value="QUARTERLY">Quarterly</SelectItem>
												<SelectItem value="SEMIANNUAL">Semiannual</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="mentorshipStartDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Mentorship Start Date</FormLabel>
										<FormControl>
											<Input type="date" {...field} value={field.value ?? ''} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="mentorshipEndDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Mentorship End Date</FormLabel>
										<FormControl>
											<Input type="date" {...field} value={field.value ?? ''} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="weeklyMentorshipSessions"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Weekly Mentorship Sessions (1-3)</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={1}
												max={3}
												{...field}
												value={field.value ?? ''}
												onChange={(e) =>
													field.onChange(
														e.target.value
															? Number.parseInt(e.target.value, 10)
															: undefined
													)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<DialogFooter className="flex items-center justify-between">
							<Button
								type="button"
								variant="secondary"
								onClick={() => resetSessionsMutation.mutate({ userId })}
								disabled={resetSessionsMutation.isPending}
							>
								{resetSessionsMutation.isPending
									? 'Resetting...'
									: 'Reset Weekly Sessions'}
							</Button>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={updateUserMutation.isPending}>
									{updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
