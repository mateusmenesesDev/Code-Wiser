'use client';

import { ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent } from '~/common/components/ui/card';
import {
	getCategoryColor,
	getDifficultyColor
} from '~/common/utils/colorUtils';
import type { ProjectTemplateInfoApiOutput } from '../../types/Projects.type';
import { ProjectDetailOverview } from './ProjectDetailOverview';
import { ProjectDetailSidebar } from './ProjectDetailSidebar';
import { ProjectImageGallery } from './ProjectImageGallery';

export default function ProjectDetail({
	project
}: {
	project: NonNullable<ProjectTemplateInfoApiOutput>;
}) {
	const router = useRouter();

	const handleGoBack = () => {
		router.back();
	};
	return (
		<div>
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

					<ProjectImageGallery
						images={project.images.map((image) => ({
							url: image.url ?? '',
							alt: image.alt ?? ''
						}))}
						projectTitle={project.title}
					/>

					<ProjectDetailOverview project={project} />
				</div>

				<div className="lg:col-span-1">
					<ProjectDetailSidebar project={project} />
				</div>
			</div>
		</div>
	);
}
