import { X } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { GenericCombobox } from '~/common/components/ui/GenericCombobox';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Label } from '~/common/components/ui/label';
import type { ProjectTemplateFormData } from '~/features/projects/types/Projects.type';
import { api } from '~/trpc/react';

interface ProjectTechnologiesProps {
	form: UseFormReturn<ProjectTemplateFormData>;
}

export function ProjectTechnologies({ form }: ProjectTechnologiesProps) {
	const { data: technologies } = api.projectBase.getTechnologies.useQuery({
		approved: true
	});
	const {
		control,
		watch,
		setValue,
		formState: { errors }
	} = form;

	const watchedTechnologies = watch('technologies') || [];

	return (
		<div className="space-y-2">
			<Label>Technologies</Label>
			<div className="mb-2 flex flex-wrap gap-2">
				{watchedTechnologies.map((tech, index) => (
					<Badge key={tech} variant="secondary" className="text-sm">
						{tech}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="ml-2 h-4 w-4 p-0"
							onClick={() => {
								const newTechnologies = watchedTechnologies.filter(
									(_, i) => i !== index
								);
								setValue('technologies', newTechnologies);
							}}
						>
							<X className="h-3 w-3" />
						</Button>
					</Badge>
				))}
			</div>
			<GenericCombobox
				control={control}
				name="technologies"
				options={technologies?.map((tech) => tech.name) || []}
				placeholder="Select technologies"
				label="Technologies"
				multiple
			/>
			<ErrorMessage message={errors.technologies?.message} />
		</div>
	);
}
