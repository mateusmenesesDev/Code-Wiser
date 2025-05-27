'use client';

import { useParams } from 'next/navigation';
import { api } from '~/trpc/react';

export default function ProjectPage() {
	const { slug } = useParams<{ slug: string }>();
	const project = api.project.getBySlug.useQuery({ slug });

	return <div>Project {project.data?.title}</div>;
}
