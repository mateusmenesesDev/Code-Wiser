'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '~/trpc/react';

export function useProjectMutations() {
	const router = useRouter();

	const {
		mutate: createProject,
		mutateAsync: createProjectAsync,
		isPending: isCreateProjectPending
	} = api.project.createProject.useMutation({
		onSuccess: (data) => {
			router.push(`/projects/${data}`);
		}
	});

	const {
		mutate: createProjectTemplate,
		mutateAsync: createProjectTemplateAsync,
		isPending: isCreateProjectTemplatePending
	} = api.project.createProject.useMutation({
		onSuccess: () => {
			toast.success('Project template created successfully');
		}
	});

	return {
		createProject,
		createProjectTemplate,
		createProjectAsync,
		createProjectTemplateAsync,
		isCreateProjectPending,
		isCreateProjectTemplatePending
	};
}
