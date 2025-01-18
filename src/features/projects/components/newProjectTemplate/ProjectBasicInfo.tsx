import { ProjectDifficultyEnum } from '@prisma/client';
import type { UseFormReturn } from 'react-hook-form';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { GenericCombobox } from '~/common/components/ui/GenericCombobox';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { Textarea } from '~/common/components/ui/textarea';
import { useGetProjectCategories } from '../../hooks/useGetProjectCategories';
import type { ProjectFormData } from '../../types/Projects.type';

interface ProjectBasicInfoProps {
	form: UseFormReturn<ProjectFormData>;
}

export function ProjectBasicInfo({ form }: ProjectBasicInfoProps) {
	const { data: categories, isLoading } = useGetProjectCategories({
		approved: true
	});

	const {
		register,
		control,
		formState: { errors },
		setValue
	} = form;

	const handleDifficultyChange = (value: ProjectDifficultyEnum) => {
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
					disabled={isLoading}
					control={control}
					name="category"
					options={categories?.map((category) => category.name) ?? []}
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
				<ErrorMessage message={errors.difficulty?.message} />
			</div>
		</>
	);
}
