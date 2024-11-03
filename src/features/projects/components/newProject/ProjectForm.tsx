'use client';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { ProjectTypeEnum } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { api } from '~/trpc/react';

import { projectSchema } from '../../schemas/projects.schema';
import type { ProjectFormData } from '../../types/Projects.type';

import { Button } from '~/common/components/button';

import { ProjectBasicInfo } from './ProjectBasicInfo';
import { ProjectImages } from './ProjectImages';
import { ProjectLearningOutcomes } from './ProjectLearningOutcomes';
import { ProjectMilestones } from './ProjectMilestones';
import { ProjectParticipants } from './ProjectParticipants';
import { ProjectTechnologies } from './ProjectTechnologies';
import { ProjectTimeline } from './ProjectTimeline';
import { ProjectType } from './ProjectType';

export default function ProjectForm() {
	const router = useRouter();

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

	const projectMutation = api.project.create.useMutation();

	const onSubmit = (data: ProjectFormData) => {
		toast.promise(projectMutation.mutateAsync(data), {
			success: 'Project created successfully',
			error: 'Failed to create project',
			loading: 'Creating project...'
		});

		router.push('/projects');
	};

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			<ProjectBasicInfo form={form} />
			<ProjectParticipants form={form} />
			<ProjectType form={form} />
			<ProjectTimeline form={form} /> <ProjectTechnologies form={form} />
			<ProjectLearningOutcomes form={form} />
			<ProjectMilestones form={form} />
			<ProjectImages form={form} />
			<Button
				type="submit"
				className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
			>
				Create Project
			</Button>
		</form>
	);
}
