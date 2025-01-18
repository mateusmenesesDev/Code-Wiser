import { Minus, PlusCircle } from 'lucide-react';
import { type UseFormReturn, useFieldArray } from 'react-hook-form';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { Button } from '~/common/components/ui/button';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import type { ProjectFormData } from '../../types/Projects.type';

interface ProjectMilestonesProps {
	form: UseFormReturn<ProjectFormData>;
}

export function ProjectMilestones({ form }: ProjectMilestonesProps) {
	const {
		control,
		register,
		formState: { errors }
	} = form;
	const { fields, append, remove } = useFieldArray({
		name: 'milestones',
		control
	});

	return (
		<div className="space-y-2">
			<Label>Milestones</Label>
			{fields.map((field, index) => (
				<div key={field.id} className="flex items-center space-x-2">
					<Input
						{...register(`milestones.${index}.value`)}
						placeholder={`Milestone ${index + 1}`}
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
				Add Milestone
			</Button>
			<ErrorMessage message={errors.milestones?.root?.message} />
		</div>
	);
}
