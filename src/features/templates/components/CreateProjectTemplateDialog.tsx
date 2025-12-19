'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	ProjectAccessTypeEnum,
	ProjectDifficultyEnum,
	ProjectMethodologyEnum
} from '@prisma/client';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import type { SubmitHandler, UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { Textarea } from '~/common/components/ui/textarea';
import { api } from '~/trpc/react';
import { createProjectTemplateSchema } from '../schemas/template.schema';
import type { CreateProjectTemplateInput } from '../types/Template.type';

interface AddListFieldProps {
	label: string;
	placeholder: string;
	form: UseFormReturn<CreateProjectTemplateInput>;
	fieldName: keyof CreateProjectTemplateInput;
	newValue: string;
	onNewValueChange: (value: string) => void;
	error?: string;
}

function AddListField({
	label,
	placeholder,
	form,
	fieldName,
	newValue,
	onNewValueChange,
	error
}: AddListFieldProps) {
	const values = form.getValues(fieldName) as string[];

	const handleAdd = () => {
		if (newValue.trim() && !values.includes(newValue.trim())) {
			form.setValue(fieldName, [...values, newValue.trim()]);
			onNewValueChange('');
		}
	};

	const handleRemove = (valueToRemove: string) => {
		form.setValue(
			fieldName,
			values.filter((v: string) => v !== valueToRemove)
		);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleAdd();
		}
	};

	return (
		<FormItem>
			<FormLabel>{label}</FormLabel>
			<div className="flex gap-2">
				<Input
					value={newValue}
					onChange={(e) => onNewValueChange(e.target.value)}
					placeholder={placeholder}
					onKeyPress={handleKeyPress}
				/>
				<Button type="button" onClick={handleAdd} variant="outline">
					<Plus className="h-4 w-4" />
				</Button>
			</div>
			<div className="mt-2 flex flex-wrap gap-2">
				{values.map((value) => (
					<Badge
						key={value}
						variant="secondary"
						className="cursor-pointer"
						onClick={() => handleRemove(value)}
					>
						{value} <X className="ml-1 h-3 w-3" />
					</Badge>
				))}
			</div>
			{error && <p className="font-medium text-destructive text-sm">{error}</p>}
		</FormItem>
	);
}

interface CreateProjectTemplateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onTemplateCreated?: () => void;
}

export function CreateProjectTemplateDialog({
	open,
	onOpenChange,
	onTemplateCreated
}: CreateProjectTemplateDialogProps) {
	const [newTechnology, setNewTechnology] = useState('');
	const [newMilestone, setNewMilestone] = useState('');
	const [newLearningOutcome, setNewLearningOutcome] = useState('');
	const [newPreRequisite, setNewPreRequisite] = useState('');

	const form = useForm<CreateProjectTemplateInput>({
		resolver: zodResolver(createProjectTemplateSchema),
		defaultValues: {
			title: '',
			description: '',
			category: '',
			difficulty: ProjectDifficultyEnum.BEGINNER,
			accessType: ProjectAccessTypeEnum.FREE,
			technologies: [],
			figmaProjectUrl: '',
			minParticipants: 1,
			maxParticipants: 4,
			credits: 0,
			expectedDuration: '',
			methodology: ProjectMethodologyEnum.SCRUM,
			milestones: [],
			learningOutcomes: [],
			preRequisites: []
		}
	});

	const createTemplateMutation = api.projectTemplate.create.useMutation({
		onSuccess: () => {
			toast.success('Template created successfully');
			form.reset();
			onOpenChange(false);
			onTemplateCreated?.();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to create template');
		}
	});

	const onSubmit: SubmitHandler<CreateProjectTemplateInput> = (data) => {
		createTemplateMutation.mutate(data);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create New Project Template</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Basic Information */}
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Title *</FormLabel>
										<FormControl>
											<Input placeholder="e.g., React Dashboard" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Category *</FormLabel>
										<FormControl>
											<Input placeholder="e.g., Web Development" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description *</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Brief description (max 200 characters)"
											maxLength={200}
											rows={2}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										{field.value?.length || 0}/200 characters
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="figmaProjectUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Figma Project URL (Optional)</FormLabel>
									<FormControl>
										<Input
											type="url"
											placeholder="https://figma.com/file/..."
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Link to the Figma design file for this project
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Properties */}
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="difficulty"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Difficulty</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value={ProjectDifficultyEnum.BEGINNER}>
													Beginner
												</SelectItem>
												<SelectItem value={ProjectDifficultyEnum.INTERMEDIATE}>
													Intermediate
												</SelectItem>
												<SelectItem value={ProjectDifficultyEnum.ADVANCED}>
													Advanced
												</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="accessType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Access Type</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value={ProjectAccessTypeEnum.FREE}>
													Free
												</SelectItem>
												<SelectItem value={ProjectAccessTypeEnum.CREDITS}>
													Credits
												</SelectItem>
												<SelectItem value={ProjectAccessTypeEnum.MENTORSHIP}>
													Premium Mentorship
												</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Credits field - only show if access type is CREDITS */}
						{form.watch('accessType') === ProjectAccessTypeEnum.CREDITS && (
							<FormField
								control={form.control}
								name="credits"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Credits Required *</FormLabel>
										<FormControl>
											<Input
												type="number"
												min="1"
												placeholder="Number of credits required"
												{...field}
												onChange={(e) => field.onChange(Number(e.target.value))}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{/* Participants */}
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="minParticipants"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Minimum Participants</FormLabel>
										<FormControl>
											<Input
												type="number"
												min="1"
												{...field}
												onChange={(e) => field.onChange(Number(e.target.value))}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="maxParticipants"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Maximum Participants</FormLabel>
										<FormControl>
											<Input
												type="number"
												min="1"
												{...field}
												onChange={(e) => field.onChange(Number(e.target.value))}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Technologies */}
						<FormField
							control={form.control}
							name="technologies"
							render={({ fieldState }) => (
								<AddListField
									label="Technologies Used *"
									placeholder="Add technology"
									form={form}
									fieldName="technologies"
									newValue={newTechnology}
									onNewValueChange={setNewTechnology}
									error={fieldState.error?.message}
								/>
							)}
						/>

						{/* Milestones */}
						<FormField
							control={form.control}
							name="milestones"
							render={({ fieldState }) => (
								<AddListField
									label="Project Milestones *"
									placeholder="Add milestone"
									form={form}
									fieldName="milestones"
									newValue={newMilestone}
									onNewValueChange={setNewMilestone}
									error={fieldState.error?.message}
								/>
							)}
						/>

						{/* Learning Outcomes */}
						<FormField
							control={form.control}
							name="learningOutcomes"
							render={({ fieldState }) => (
								<AddListField
									label="Learning Outcomes *"
									placeholder="Add learning outcome"
									form={form}
									fieldName="learningOutcomes"
									newValue={newLearningOutcome}
									onNewValueChange={setNewLearningOutcome}
									error={fieldState.error?.message}
								/>
							)}
						/>

						{/* Pre-requisites */}
						<FormField
							control={form.control}
							name="preRequisites"
							render={({ fieldState }) => (
								<AddListField
									label="Project Pre-requisites *"
									placeholder="Add pre-requisite"
									form={form}
									fieldName="preRequisites"
									newValue={newPreRequisite}
									onNewValueChange={setNewPreRequisite}
									error={fieldState.error?.message}
								/>
							)}
						/>

						{/* Submit Buttons */}
						<div className="flex justify-end gap-4 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={createTemplateMutation.isPending}
								className="bg-info text-info-foreground hover:bg-info/90"
							>
								{createTemplateMutation.isPending
									? 'Creating...'
									: 'Create Template'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
