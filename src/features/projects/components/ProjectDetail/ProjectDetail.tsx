import { Clock } from 'lucide-react';
import { Suspense } from 'react';
import GoBackButton from '~/common/components/GoBackButton';
import { Badge } from '~/common/components/ui/badge';
import { Card, CardContent } from '~/common/components/ui/card';
import { getDifficultyBadgeColor } from '~/common/utils/colorUtils';
import type { ProjectTemplateInfoApiOutput } from '../../types/Projects.type';
import { ProjectDetailOverview } from './ProjectDetailOverview';
import { ProjectDetailSidebar } from './ProjectDetailSidebar';
import { ProjectImageGallery } from './ProjectImageGallery';
import { SidebarSkeleton } from './SidebarSkeleton';

export default function ProjectDetail({
	project
}: {
	project: NonNullable<ProjectTemplateInfoApiOutput>;
}) {
	return (
		<div>
			<GoBackButton>Back to Projects</GoBackButton>
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<div className="space-y-8 lg:col-span-2">
					<Card className="animate-fade-in overflow-hidden shadow-lg">
						<CardContent className="p-8">
							<div className="mb-4 flex items-start justify-between">
								<div>
									<h1 className="mb-2 font-bold text-3xl">{project.title}</h1>
									<div className="flex items-center gap-4 text-sm">
										<div className="flex items-center gap-1">
											<Clock className="h-4 w-4" />
											<span>{project.expectedDuration || '6-8 weeks'}</span>
										</div>
									</div>
								</div>
								<div className="flex gap-2">
									<Badge variant="secondary">{project.category.name}</Badge>
									<Badge variant={getDifficultyBadgeColor(project.difficulty)}>
										{project.difficulty}
									</Badge>
								</div>
							</div>

							<div className="leading-relaxed">{project.description}</div>
						</CardContent>
					</Card>

					<ProjectImageGallery
						images={project.images.map((image) => ({
							url: image.url ?? '',
							alt: image.alt ?? ''
						}))}
						projectTitle={project.title}
					/>
					<ProjectDetailOverview project={project} />
				</div>
				<Suspense fallback={<SidebarSkeleton />}>
					<div className="lg:col-span-1">
						<ProjectDetailSidebar project={project} />
					</div>
				</Suspense>
			</div>
		</div>
	);
}
