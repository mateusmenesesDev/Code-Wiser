import type { UseFormReturn } from 'react-hook-form';
import { Input } from '~/common/components/input';
import { Label } from '~/common/components/label';
import type { ProjectFormData } from '../../types/Projects.type';

interface ProjectTimelineProps {
	form: UseFormReturn<ProjectFormData>;
}

export function ProjectTimeline({ form }: ProjectTimelineProps) {
	const { register } = form;

	return (
		<div className="space-y-2">
			<Label htmlFor="timeline">Project Timeline (Optional)</Label>
			<Input
				id="timeline"
				placeholder="e.g., 2 weeks, 1 month"
				{...register('timeline')}
			/>
		</div>
	);
}
