'use client';

import { ArrowLeft, Clock } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent } from '~/common/components/ui/card';
import {
	getCategoryColor,
	getDifficultyColor
} from '~/common/utils/colorUtils';
import ProjectDetailNotFound from '~/features/projects/components/ProjectDetail/ProjectDetailNotFound';
import { ProjectDetailOverview } from '~/features/projects/components/ProjectDetail/ProjectDetailOverview';
import { ProjectDetailSidebar } from '~/features/projects/components/ProjectDetail/ProjectDetailSidebar';
import { ProjectDetailSkeleton } from '~/features/projects/components/ProjectDetail/ProjectDetailSkeleton';
import { ProjectImageGallery } from '~/features/projects/components/ProjectDetail/ProjectImageGallery';
import { useProjectDetail } from '~/features/projects/hooks/useProjectDetail';

export default function ProjectDetailPage() {
	const params = useParams();
	const id = params.id as string;
	const router = useRouter();

	const { project, isLoading } = useProjectDetail(id);

	const handleGoBack = () => {
		router.back();
	};

	if (isLoading) {
		return <ProjectDetailSkeleton />;
	}

	if (!project) {
		return <ProjectDetailNotFound />;
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<Button variant="ghost" className="mb-6" onClick={handleGoBack}>
				<ArrowLeft className="mr-2 h-4 w-4" />
				Back to Projects
			</Button>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<div className="space-y-8 lg:col-span-2">
					<Card className="animate-fade-in overflow-hidden shadow-lg">
						<CardContent className="p-8">
							<div className="mb-4 flex items-start justify-between">
								<div>
									<h1 className="mb-2 font-bold text-3xl">{project.title}</h1>
									<div className="flex items-center gap-4 text-sm">
										{/* TODO: Add rating */}
										{/* <div className="flex items-center gap-1">
											<Star className="h-4 w-4 fill-current text-yellow-500" />
											<span className="font-medium">4.8</span>
											<span>(67 reviews)</span>
										</div> */}
										{/* TODO: Add rating */}
										{/* <div className="flex items-center gap-1">
											<Users className="h-4 w-4" />
											<span>234 enrolled</span>
										</div> */}
										<div className="flex items-center gap-1">
											<Clock className="h-4 w-4" />
											<span>{project.expectedDuration || '6-8 weeks'}</span>
										</div>
									</div>
								</div>
								<div className="flex gap-2">
									<Badge className={getCategoryColor(project.category.name)}>
										{project.category.name}
									</Badge>
									<Badge
										variant="outline"
										className={getDifficultyColor(project.difficulty)}
									>
										{project.difficulty}
									</Badge>
								</div>
							</div>

							<div className="leading-relaxed">{project.description}</div>
						</CardContent>
					</Card>

					<ProjectImageGallery images={[]} projectTitle={project.title} />

					<ProjectDetailOverview project={project} />
				</div>

				<div className="lg:col-span-1">
					<ProjectDetailSidebar project={project} />
				</div>
			</div>
		</div>
	);
}
