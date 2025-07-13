import ProjectDetail from '~/features/projects/components/ProjectDetail/ProjectDetail';
import ProjectDetailNotFound from '~/features/projects/components/ProjectDetail/ProjectDetailNotFound';
import { db } from '~/server/db';
import { api } from '~/trpc/server';

export async function generateMetadata({ params }: { params: { id: string } }) {
	const project = await db.projectTemplate.findUnique({
		where: {
			id: params.id,
			status: 'APPROVED'
		},
		select: {
			title: true,
			description: true
		}
	});

	if (!project) {
		return {
			title: 'Project Not Found',
			description: 'Project Not Found'
		};
	}

	return {
		title: project.title,
		description: project.description,
		openGraph: {
			title: project.title,
			description: project.description,
			type: 'website'
		}
	};
}

export async function generateStaticParams() {
	const projects = await db.projectTemplate.findMany({
		where: { status: 'APPROVED' },
		select: { id: true }
	});

	return projects.map((project) => ({
		id: project.id
	}));
}

export default async function ProjectDetailPage({
	params
}: {
	params: { id: string };
}) {
	const id = params.id;

	const project = await api.projectTemplate.getInfoById({ id });

	if (!project) {
		return <ProjectDetailNotFound />;
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<ProjectDetail project={project} />
		</div>
	);
}
