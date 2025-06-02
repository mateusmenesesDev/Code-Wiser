import { Minus, PlusCircle } from 'lucide-react';
import { type UseFormReturn, useFieldArray } from 'react-hook-form';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { Button } from '~/common/components/ui/button';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import type { ProjectTemplateFormData } from '~/features/projects/types/Projects.type';

interface ProjectLearningOutcomesProps {
	form: UseFormReturn<ProjectTemplateFormData>;
}

export function ProjectLearningOutcomes({
	form
}: ProjectLearningOutcomesProps) {
	const {
		control,
		register,
		formState: { errors }
	} = form;
	const { fields, append, remove } = useFieldArray({
		name: 'learningOutcomes',
		control
	});

	return (
		<div className="space-y-2">
			<Label>Learning Outcomes</Label>
			{fields.map((field, index) => (
				<div key={field.id} className="flex items-center space-x-2">
					<Input
						{...register(`learningOutcomes.${index}.value`)}
						placeholder={`Learning outcome ${index + 1}`}
					/>
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={() => remove(index)}
					>
						<Minus className="h-4 w-4" />
					</Button>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => append({ value: '' })}
			>
				<PlusCircle className="mr-2 h-4 w-4" />
				Add Learning Outcome
			</Button>
			<ErrorMessage message={errors.learningOutcomes?.root?.message} />
		</div>
	);
}
