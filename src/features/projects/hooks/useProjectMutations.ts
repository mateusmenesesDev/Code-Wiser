'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '~/trpc/react';

export function useProjectMutations() {
	const router = useRouter();
	const utils = api.useUtils();

	const {
		mutate: createProject,
		mutateAsync: createProjectAsync,
		isPending: isCreateProjectPending
	} = api.project.createProject.useMutation({
		onSuccess: (data) => {
			router.push(`/workspace/${data}`);
			utils.project.getEnrolled.invalidate();
			utils.projectTemplate.getApproved.invalidate();
		}
	});

	const {
		mutate: createProjectTemplate,
		mutateAsync: createProjectTemplateAsync,
		isPending: isCreateProjectTemplatePending
	} = api.projectTemplate.create.useMutation({
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
