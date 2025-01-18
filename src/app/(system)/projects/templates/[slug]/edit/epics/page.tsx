'use client';

import { useParams } from 'next/navigation';
import { EpicManagement } from '~/features/projectManagement/components/epic/EpicManagement';
import { api } from '~/trpc/react';

export default function EpicsPage() {
	const { slug } = useParams();

	const { data: project } = api.projectTemplate.getBySlug.useQuery({
		slug: slug as string
	});

	if (!project) return null;

	return <EpicManagement projectId={project.id} isTemplate={true} />;
}
