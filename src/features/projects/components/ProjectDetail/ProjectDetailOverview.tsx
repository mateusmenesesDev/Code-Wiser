import { BookOpen, Check, Code2, Target } from 'lucide-react';
import { Badge } from '~/common/components/ui/badge';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from '~/common/components/ui/tabs';
import type { ProjectTemplateBySlugApiResponse } from '../../types/Projects.type';

interface ProjectDetailOverviewProps {
	project: NonNullable<ProjectTemplateBySlugApiResponse>;
}

export function ProjectDetailOverview({ project }: ProjectDetailOverviewProps) {
	// Mock prerequisites for now - these could be added to the database later
	const prerequisites = [
		'Solid understanding of JavaScript ES6+',
		'Basic React knowledge (hooks, components)',
		'Understanding of REST APIs',
		'Basic SQL knowledge'
	];

	// Simplified modules based on sprints
	const modules =
		project.sprints?.map((sprint, index) => ({
			id: sprint.id,
			title: sprint.title || `Module ${index + 1}`,
			duration: `Week ${index + 1}`,
			description: sprint.description || 'Module content will be defined.'
		})) || [];

	return (
		<Card className="overflow-hidden shadow-lg">
			<Tabs defaultValue="overview" className="w-full">
				<TabsList className="mt-6 grid w-full grid-cols-3">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="curriculum">Curriculum</TabsTrigger>
					<TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="p-6 pt-6">
					<div className="space-y-6">
						<div>
							<h3 className="mb-3 flex items-center gap-2 font-semibold text-lg">
								<Target className="h-5 w-5 text-primary" />
								Learning Outcomes
							</h3>
							<div className="grid gap-3">
								{project.learningOutcomes?.map((outcome) => (
									<div key={outcome.id} className="flex items-start gap-3">
										<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
										<span>{outcome.value}</span>
									</div>
								))}
								{(!project.learningOutcomes ||
									project.learningOutcomes.length === 0) && (
									<div className="text-muted-foreground text-sm">
										Learning outcomes will be defined for this project.
									</div>
								)}
							</div>
						</div>

						<div>
							<h3 className="mb-3 flex items-center gap-2 font-semibold text-lg">
								<Code2 className="h-5 w-5 text-primary" />
								Technologies You'll Use
							</h3>
							<div className="flex flex-wrap gap-2">
								{project.technologies?.map((tech) => (
									<Badge
										key={tech.id}
										variant="outline"
										className="hover:border-primary hover:bg-primary hover:text-primary"
									>
										{tech.name}
									</Badge>
								))}
								{(!project.technologies ||
									project.technologies.length === 0) && (
									<div className="text-muted-foreground text-sm">
										Technology stack will be defined for this project.
									</div>
								)}
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="curriculum" className="p-6 pt-6">
					<div className="space-y-4">
						{modules.length > 0 ? (
							modules.map((module) => (
								<Card key={module.id} className="border-l-4 border-l-primary">
									<CardHeader className="pb-3">
										<div className="flex items-center justify-between">
											<CardTitle className="text-base">
												{module.title}
											</CardTitle>
											<Badge variant="outline" className="text-xs">
												{module.duration}
											</Badge>
										</div>
									</CardHeader>
									<CardContent>
										<div className="text-muted-foreground text-sm">
											{module.description}
										</div>
									</CardContent>
								</Card>
							))
						) : (
							<div className="py-8 text-center">
								<div className="text-muted-foreground">
									Curriculum modules will be available once the project
									structure is defined.
								</div>
							</div>
						)}
					</div>
				</TabsContent>

				<TabsContent value="prerequisites" className="p-6 pt-6">
					<div>
						<h3 className="mb-4 flex items-center gap-2 font-semibold text-lg">
							<BookOpen className="h-5 w-5 text-primary" />
							What You Need to Know
						</h3>
						<div className="space-y-3">
							{prerequisites.map((prereq) => (
								<div
									key={`prereq-${prereq.replace(/\s+/g, '-').toLowerCase()}`}
									className="flex items-start gap-3 rounded-lg p-3"
								>
									<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
									<span>{prereq}</span>
								</div>
							))}
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</Card>
	);
}
