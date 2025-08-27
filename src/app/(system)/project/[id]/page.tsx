import ProjectDetail from '~/features/projects/components/ProjectDetail/ProjectDetail';
import ProjectDetailNotFound from '~/features/projects/components/ProjectDetail/ProjectDetailNotFound';
import { db } from '~/server/db';
import { api } from '~/trpc/server';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { id: string } }) {
	const project = await db.projectTemplate.findUnique({
		where: {
			id: params.id,
			status: 'APPROVED'
		},
		select: {
			title: true,
			description: true,
			difficulty: true,
			expectedDuration: true,
			category: { select: { name: true } },
			technologies: { select: { name: true } },
			images: {
				select: {
					url: true,
					alt: true
				},
				orderBy: { order: 'asc' }
			}
		}
	});

	if (!project) {
		return {
			title: 'Project Not Found',
			description: 'Project Not Found'
		};
	}

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Course',
		name: project.title,
		description: project.description,
		provider: {
			'@type': 'Organization',
			name: 'CodeWise',
			url: 'https://codewise.com'
		},
		courseMode: 'online',
		educationalLevel: project.difficulty.toLowerCase(),
		timeRequired: project.expectedDuration,
		category: project.category.name,
		teaches: project.technologies.map((tech) => tech.name).join(', '),
		image: project.images?.[0]?.url
	};

	const keywords = [
		project.category.name,
		project.difficulty,
		...project.technologies.map((tech) => tech.name),
		'software development',
		'coding project',
		'programming tutorial',
		'fullstack development',
		'web development'
	].join(', ');

	return {
		title: project.title,
		description: project.description,
		keywords,
		openGraph: {
			title: project.title,
			description: project.description,
			type: 'website',
			url: `https://codewise.com/project/${params.id}`,
			siteName: 'CodeWise',
			images: project.images?.map((img) => ({
				url: img.url,
				alt: img.alt || `${project.title} preview`,
				width: 1200,
				height: 630
			}))
		},
		twitter: {
			card: 'summary_large_image',
			title: project.title,
			description: project.description,
			images: project.images?.[0]?.url
		},
		alternates: {
			canonical: `https://codewise.com/project/${params.id}`
		},
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				'max-video-preview': -1,
				'max-image-preview': 'large',
				'max-snippet': -1
			}
		},
		other: {
			'application/ld+json': JSON.stringify(jsonLd)
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
