import { DifficultyEnum } from '@prisma/client';
import type { UseFormReturn } from 'react-hook-form';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { GenericCombobox } from '~/common/components/GenericCombobox';
import { Input } from '~/common/components/input';
import { Label } from '~/common/components/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/select';
import { Textarea } from '~/common/components/textarea';
import { categories } from '../../mocks/projectsData';
import type { ProjectFormData } from '../../types/Projects.type';

interface ProjectBasicInfoProps {
	form: UseFormReturn<ProjectFormData>;
}

export function ProjectBasicInfo({ form }: ProjectBasicInfoProps) {
	const {
		register,
		control,
		formState: { errors },
		setValue
	} = form;

	const handleDifficultyChange = (value: DifficultyEnum) => {
		setValue('difficulty', value);
	};

	return (
		<>
			<div className="space-y-2">
				<Label htmlFor="title">Project Title</Label>
				<Input id="title" {...register('title')} />
				<ErrorMessage message={errors.title?.message} />
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Project Description</Label>
				<Textarea id="description" {...register('description')} />
				<ErrorMessage message={errors.description?.message} />
			</div>

			<div className="flex flex-col space-y-2">
				<Label>Category</Label>
				<GenericCombobox
					control={control}
					name="category"
					options={categories}
					placeholder="Select category"
					label="Category"
				/>
				<ErrorMessage message={errors.category?.message} />
			</div>

			<div className="space-y-2">
				<Label htmlFor="difficulty">Difficulty</Label>
				<Select onValueChange={handleDifficultyChange}>
					<SelectTrigger>
						<SelectValue placeholder="Select difficulty" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={DifficultyEnum.BEGINNER}>Beginner</SelectItem>
						<SelectItem value={DifficultyEnum.INTERMEDIATE}>
							Intermediate
						</SelectItem>
						<SelectItem value={DifficultyEnum.ADVANCED}>Advanced</SelectItem>
					</SelectContent>
				</Select>
				<ErrorMessage message={errors.difficulty?.message} />
			</div>
		</>
	);
}
