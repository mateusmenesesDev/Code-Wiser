import type { UseFormReturn } from 'react-hook-form';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import type { ProjectFormData } from '../../types/Projects.type';

interface ProjectParticipantsProps {
	form: UseFormReturn<ProjectFormData>;
}

export function ProjectParticipants({ form }: ProjectParticipantsProps) {
	const {
		register,
		formState: { errors },
		watch
	} = form;

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div className="space-y-2">
				<Label htmlFor="minParticipants">Min Participants</Label>
				<Input
					id="minParticipants"
					type="number"
					{...register('minParticipants', { valueAsNumber: true })}
					min="1"
					max={watch('maxParticipants')}
				/>
				<ErrorMessage message={errors.minParticipants?.message} />
			</div>

			<div className="space-y-2">
				<Label htmlFor="maxParticipants">Max Participants</Label>
				<Input
					id="maxParticipants"
					type="number"
					{...register('maxParticipants', { valueAsNumber: true })}
					min={watch('minParticipants')}
				/>
				<ErrorMessage message={errors.maxParticipants?.message} />
			</div>
		</div>
	);
}
