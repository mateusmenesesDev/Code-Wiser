import { ProjectTypeEnum } from '@prisma/client';
import type { UseFormReturn } from 'react-hook-form';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { Input } from '~/common/components/input';
import { Label } from '~/common/components/label';
import { RadioGroup, RadioGroupItem } from '~/common/components/radio-group';
import { useAnimate } from '~/common/hooks/useAnimate';
import type { ProjectFormData } from '../../types/Projects.type';

interface ProjectTypeProps {
	form: UseFormReturn<ProjectFormData>;
}

export function ProjectType({ form }: ProjectTypeProps) {
	const {
		register,
		watch,
		setValue,
		formState: { errors }
	} = form;

	const [animateRef] = useAnimate<HTMLDivElement>();

	return (
		<>
			<div className="space-y-2">
				<Label>Project Type</Label>
				<RadioGroup
					onValueChange={(value) =>
						setValue('projectType', value as ProjectTypeEnum)
					}
					value={watch('projectType')}
				>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value={ProjectTypeEnum.FREE} id="free" />
						<Label htmlFor="free">Free</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value={ProjectTypeEnum.CREDITS} id="credits" />
						<Label htmlFor="credits">Credits Based</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem
							value={ProjectTypeEnum.MENTORSHIP}
							id="mentorship"
						/>
						<Label htmlFor="mentorship">Mentorship Based</Label>
					</div>
				</RadioGroup>
				<ErrorMessage message={errors.projectType?.message} />
			</div>

			<div ref={animateRef}>
				{watch('projectType') === ProjectTypeEnum.CREDITS && (
					<div className="space-y-2">
						<Label htmlFor="credits">Credits</Label>
						<Input
							id="credits"
							type="number"
							{...register('credits', { valueAsNumber: true })}
							min="0"
						/>
						<ErrorMessage message={errors.credits?.message} />
					</div>
				)}
			</div>
		</>
	);
}