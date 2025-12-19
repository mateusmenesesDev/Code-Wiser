'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	ProjectAccessTypeEnum,
	ProjectDifficultyEnum,
	ProjectMethodologyEnum
} from '@prisma/client';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
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
import { updateTemplateBasicInfoInputSchema } from '../../schemas/template.schema';
import type { UpdateProjectTemplateBasicInfoInput } from '../../types/Template.type';

interface EditTemplateBasicInfoProps {
	templateId: string;
	initialData: UpdateProjectTemplateBasicInfoInput;
}

interface AddListFieldProps {
	label: string;
	placeholder: string;
	form: ReturnType<typeof useForm<UpdateProjectTemplateBasicInfoInput>>;
	fieldName: keyof UpdateProjectTemplateBasicInfoInput;
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
	const addItem = () => {
		if (!newValue.trim()) return;

		const currentItems = form.getValues(fieldName) as string[];
		form.setValue(fieldName, [...currentItems, newValue.trim()]);
		onNewValueChange('');
	};

	const removeItem = (index: number) => {
		const currentItems = form.getValues(fieldName) as string[];
		form.setValue(
			fieldName,
			currentItems.filter((_, i) => i !== index)
		);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			addItem();
		}
	};

	return (
		<FormItem>
			<FormLabel>{label}</FormLabel>
			<div className="flex gap-2">
				<FormControl>
					<Input
						placeholder={placeholder}
						value={newValue}
						onChange={(e) => onNewValueChange(e.target.value)}
						onKeyPress={handleKeyPress}
					/>
				</FormControl>
				<Button type="button" onClick={addItem}>
					<Plus className="h-4 w-4" />
				</Button>
			</div>
			<div className="mt-2 flex flex-wrap gap-2">
				{(form.getValues(fieldName) as string[])?.map((item) => (
					<Badge key={`${fieldName}-${item}`} variant="secondary">
						{item}
						<button
							type="button"
							onClick={() =>
								removeItem(
									(form.getValues(fieldName) as string[]).indexOf(item)
								)
							}
							className="ml-1 hover:text-destructive"
						>
							<X className="h-3 w-3" />
						</button>
					</Badge>
				))}
			</div>
			{error && <FormMessage>{error}</FormMessage>}
		</FormItem>
	);
}

export default function EditTemplateBasicInfo({
	templateId,
	initialData
}: EditTemplateBasicInfoProps) {
	const router = useRouter();
	const [newTechnology, setNewTechnology] = useState('');
	const [newMilestone, setNewMilestone] = useState('');
	const [newLearningOutcome, setNewLearningOutcome] = useState('');
	const [newPreRequisite, setNewPreRequisite] = useState('');

	const form = useForm<UpdateProjectTemplateBasicInfoInput>({
		resolver: zodResolver(updateTemplateBasicInfoInputSchema),
		defaultValues: initialData
	});

	const utils = api.useUtils();

	const updateTemplateMutation = api.projectTemplate.update.useMutation({
		onSuccess: (data) => {
			toast.success('Template updated successfully');
			utils.projectTemplate.getById.invalidate();
			if (data.title !== initialData.title) {
				router.push(`/admin/templates/${data.id}/edit`);
			}
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to update template');
		}
	});

	const onSubmit = (data: UpdateProjectTemplateBasicInfoInput) => {
		updateTemplateMutation.mutate({ id: templateId, ...data });
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

				<FormField
					control={form.control}
					name="methodology"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Project Methodology</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value={ProjectMethodologyEnum.SCRUM}>
										Scrum
									</SelectItem>
									<SelectItem value={ProjectMethodologyEnum.KANBAN}>
										Kanban
									</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="expectedDuration"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Expected Duration</FormLabel>
							<FormControl>
								<Input
									placeholder="e.g., 2 weeks"
									{...field}
									value={field.value || ''}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

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

				<FormField
					control={form.control}
					name="milestones"
					render={({ fieldState }) => (
						<AddListField
							label="Project Milestones"
							placeholder="Add milestone"
							form={form}
							fieldName="milestones"
							newValue={newMilestone}
							onNewValueChange={setNewMilestone}
							error={fieldState.error?.message}
						/>
					)}
				/>

				<FormField
					control={form.control}
					name="learningOutcomes"
					render={({ fieldState }) => (
						<AddListField
							label="Learning Outcomes"
							placeholder="Add learning outcome"
							form={form}
							fieldName="learningOutcomes"
							newValue={newLearningOutcome}
							onNewValueChange={setNewLearningOutcome}
							error={fieldState.error?.message}
						/>
					)}
				/>

				<FormField
					control={form.control}
					name="preRequisites"
					render={({ fieldState }) => (
						<AddListField
							label="Project Pre-requisites"
							placeholder="Add pre-requisite"
							form={form}
							fieldName="preRequisites"
							newValue={newPreRequisite}
							onNewValueChange={setNewPreRequisite}
							error={fieldState.error?.message}
						/>
					)}
				/>

				<div className="flex justify-end">
					<Button
						type="submit"
						disabled={updateTemplateMutation.isPending}
						className="bg-info text-info-foreground hover:bg-info/90"
					>
						{updateTemplateMutation.isPending ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
