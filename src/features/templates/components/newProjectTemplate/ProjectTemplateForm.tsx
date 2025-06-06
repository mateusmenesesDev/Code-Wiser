'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ProjectTypeEnum } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { api } from '~/trpc/react';

import { createProjectTemplateSchema } from '../../../projects/schemas/projects.schema';
import type { ProjectTemplateFormData } from '../../../projects/types/Projects.type';

import { Button } from '~/common/components/ui/button';

import { useRouter } from 'next/navigation';
import { ProjectBasicInfo } from './ProjectBasicInfo';
import { ProjectImages } from './ProjectImages';
import { ProjectParticipants } from './ProjectParticipants';
import { ProjectTechnologies } from './ProjectTechnologies';
import { ProjectType } from './ProjectType';

export default function ProjectForm() {
	const form = useForm<ProjectTemplateFormData>({
		resolver: zodResolver(createProjectTemplateSchema),
		defaultValues: {
			images: [],
			technologies: [],
			type: ProjectTypeEnum.FREE
		},
		mode: 'onChange'
	});

	const router = useRouter();

	const projectMutation = api.projectTemplate.create.useMutation({
		onSuccess: () => {
			router.push('/projects');
		}
	});

	const onSubmit = (data: ProjectTemplateFormData) => {
		toast.promise(projectMutation.mutateAsync(data), {
			loading: 'Creating project...',
			success: 'Project created successfully',
			error:
				projectMutation.error?.data?.code === 'CONFLICT'
					? 'A project with this name already exists'
					: 'Failed to create project'
		});
	};

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			<ProjectBasicInfo form={form} />
			<ProjectParticipants form={form} />
			<ProjectType form={form} />
			<ProjectTechnologies form={form} />
			<ProjectImages form={form} />
			<Button
				type="submit"
				disabled={projectMutation.isPending}
				className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
			>
				{projectMutation.isPending ? 'Creating...' : 'Create Project'}
			</Button>
		</form>
	);
}
