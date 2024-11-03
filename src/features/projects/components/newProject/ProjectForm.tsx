'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ProjectTypeEnum } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { api } from '~/trpc/react';

import { projectSchema } from '../../schemas/projects.schema';
import type { ProjectFormData } from '../../types/Projects.type';

import { Button } from '~/common/components/button';

import { useRouter } from 'next/navigation';
import { ProjectBasicInfo } from './ProjectBasicInfo';
import { ProjectImages } from './ProjectImages';
import { ProjectLearningOutcomes } from './ProjectLearningOutcomes';
import { ProjectMilestones } from './ProjectMilestones';
import { ProjectParticipants } from './ProjectParticipants';
import { ProjectTechnologies } from './ProjectTechnologies';
import { ProjectTimeline } from './ProjectTimeline';
import { ProjectType } from './ProjectType';

export default function ProjectForm() {
	const form = useForm<ProjectFormData>({
		resolver: zodResolver(projectSchema),
		defaultValues: {
			learningOutcomes: [{ value: '' }],
			milestones: [{ value: '' }],
			images: [],
			technologies: [],
			type: ProjectTypeEnum.FREE
		},
		mode: 'onChange'
	});

	const router = useRouter();

	const projectMutation = api.project.create.useMutation({
		onSuccess: () => {
			router.push('/projects');
		}
	});

	const onSubmit = (data: ProjectFormData) => {
		const projectMutationPromise = projectMutation.mutateAsync(data);
		toast.promise(projectMutationPromise, {
			success: 'Project created successfully',
			error:
				projectMutation.error?.data?.code === 'CONFLICT'
					? projectMutation.error.message
					: 'Something went wrong',
			loading: 'Creating project...'
		});

		console.error('error client', projectMutation.error?.data?.code);
	};

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			<ProjectBasicInfo form={form} />
			<ProjectParticipants form={form} />
			<ProjectType form={form} />
			<ProjectTimeline form={form} />
			<ProjectTechnologies form={form} />
			<ProjectLearningOutcomes form={form} />
			<ProjectMilestones form={form} />
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
