import { Badge } from '~/common/components/badge';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/card';

interface ProjectOverviewProps {
	project: {
		details: string;
		technologies: string[];
		learningOutcomes: string[];
		startDate: string;
		endDate: string;
		timeline: string;
	};
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Project Overview</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<h3 className="mb-2 font-semibold text-lg text-primary">
						Project Details
					</h3>
					<p className="text-muted-foreground">{project.details}</p>
				</div>
				<div>
					<h3 className="mb-2 font-semibold text-lg text-primary">
						Technologies
					</h3>
					<div className="flex flex-wrap gap-2">
						{project.technologies.map((tech) => (
							<Badge key={tech} variant="secondary">
								{tech}
							</Badge>
						))}
					</div>
				</div>
				<div>
					<h3 className="mb-2 font-semibold text-lg text-primary">
						Learning Outcomes
					</h3>
					<ul className="list-disc space-y-1 pl-5 text-muted-foreground">
						{project.learningOutcomes.map((outcome) => (
							<li key={outcome}>{outcome}</li>
						))}
					</ul>
				</div>
				<div className="flex flex-col gap-4 md:flex-row">
					<div className="flex-1">
						<h3 className="mb-2 font-semibold text-lg text-primary">
							Start Date
						</h3>
						<p className="text-muted-foreground">
							{new Date(project.startDate).toLocaleDateString()}
						</p>
					</div>
					<div className="flex-1">
						<h3 className="mb-2 font-semibold text-lg text-primary">
							End Date
						</h3>
						<p className="text-muted-foreground">
							{new Date(project.endDate).toLocaleDateString()}
						</p>
					</div>
					<div className="flex-1">
						<h3 className="mb-2 font-semibold text-lg text-primary">
							Duration
						</h3>
						<p className="text-muted-foreground">{project.timeline}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
