import type { UseFormReturn } from 'react-hook-form';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import type { ProjectFormData } from '../../../projects/types/Projects.type';

interface ProjectTimelineProps {
	form: UseFormReturn<ProjectFormData>;
}

export function ProjectTimeline({ form }: ProjectTimelineProps) {
	const { register } = form;

	return (
		<div className="space-y-2">
			<Label htmlFor="expectedDuration">Project Duration (Optional)</Label>
			<Input
				id="expectedDuration"
				placeholder="e.g., 2 weeks, 1 month"
				{...register('expectedDuration')}
			/>
		</div>
	);
}
