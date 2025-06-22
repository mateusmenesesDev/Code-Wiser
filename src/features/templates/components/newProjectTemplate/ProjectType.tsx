import { ProjectAccessTypeEnum } from '@prisma/client';
import type { UseFormReturn } from 'react-hook-form';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import { RadioGroup, RadioGroupItem } from '~/common/components/ui/radio-group';
import { useAnimate } from '~/common/hooks/useAnimate';
import type { ProjectTemplateFormData } from '~/features/projects/types/Projects.type';

interface ProjectTypeProps {
	form: UseFormReturn<ProjectTemplateFormData>;
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
						setValue('accessType', value as ProjectAccessTypeEnum)
					}
					value={watch('accessType')}
				>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value={ProjectAccessTypeEnum.FREE} id="free" />
						<Label htmlFor="free">Free</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem
							value={ProjectAccessTypeEnum.CREDITS}
							id="credits"
						/>
						<Label htmlFor="credits">Credits Based</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem
							value={ProjectAccessTypeEnum.MENTORSHIP}
							id="mentorship"
						/>
						<Label htmlFor="mentorship">Mentorship Based</Label>
					</div>
				</RadioGroup>
				<ErrorMessage message={errors.accessType?.message} />
			</div>

			<div ref={animateRef}>
				{watch('accessType') === ProjectAccessTypeEnum.CREDITS && (
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
