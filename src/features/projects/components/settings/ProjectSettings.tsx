'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '~/common/components/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/card';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '~/common/components/form';
import { Input } from '~/common/components/input';
import { RadioGroup, RadioGroupItem } from '~/common/components/radio-group';
import { Separator } from '~/common/components/separator';
import { Textarea } from '~/common/components/textarea';
import type { Project } from '../../types';

const projectFormSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string().min(1, 'Description is required'),
	methodology: z.enum(['kanban', 'scrum']),
	visibility: z.enum(['public', 'private'])
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectSettingsProps {
	project: Project;
}

export function ProjectSettings({ project }: ProjectSettingsProps) {
	const form = useForm<ProjectFormValues>({
		resolver: zodResolver(projectFormSchema),
		defaultValues: {
			title: project.title,
			description: project.description,
			methodology: project.methodology,
			visibility: 'public'
		}
	});

	function onSubmit(data: ProjectFormValues) {
		toast.success('Project settings updated');
		console.log(data);
	}

	return (
		<div className="py-6">
			<div className="mb-6">
				<h2 className="font-semibold text-2xl">Project Settings</h2>
				<p className="text-muted-foreground">
					Manage your project settings and preferences
				</p>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<Card>
						<CardHeader>
							<CardTitle>General Settings</CardTitle>
							<CardDescription>
								Basic information about your project
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Project Title</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormDescription>
											This is your project's display name.
										</FormDescription>
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
										<FormDescription>
											Brief description of your project.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Separator />

							<FormField
								control={form.control}
								name="methodology"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Project Methodology</FormLabel>
										<FormControl>
											<RadioGroup
												onValueChange={field.onChange}
												defaultValue={field.value}
												className="grid grid-cols-2 gap-4"
											>
												<FormItem>
													<FormControl>
														<RadioGroupItem value="kanban" />
													</FormControl>
													<FormLabel className="font-normal">Kanban</FormLabel>
												</FormItem>
												<FormItem>
													<FormControl>
														<RadioGroupItem value="scrum" />
													</FormControl>
													<FormLabel className="font-normal">Scrum</FormLabel>
												</FormItem>
											</RadioGroup>
										</FormControl>
										<FormDescription>
											Choose your project management methodology.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Separator />

							<FormField
								control={form.control}
								name="visibility"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Project Visibility</FormLabel>
										<FormControl>
											<RadioGroup
												onValueChange={field.onChange}
												defaultValue={field.value}
												className="grid grid-cols-2 gap-4"
											>
												<FormItem>
													<FormControl>
														<RadioGroupItem value="public" />
													</FormControl>
													<FormLabel className="font-normal">Public</FormLabel>
												</FormItem>
												<FormItem>
													<FormControl>
														<RadioGroupItem value="private" />
													</FormControl>
													<FormLabel className="font-normal">Private</FormLabel>
												</FormItem>
											</RadioGroup>
										</FormControl>
										<FormDescription>
											Control who can see your project.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					<div className="flex justify-end">
						<Button type="submit">Save Changes</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
