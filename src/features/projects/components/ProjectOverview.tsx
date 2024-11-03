import type { LearningOutcome, Technology } from '@prisma/client';
import { Badge } from '~/common/components/badge';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/card';

interface ProjectOverviewProps {
	description: string;
	technologies: Technology[];
	learningOutcomes: LearningOutcome[];
}

export function ProjectOverview({
	description,
	technologies,
	learningOutcomes
}: ProjectOverviewProps) {
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
					<p className="text-muted-foreground">{description}</p>
				</div>
				<div>
					<h3 className="mb-2 font-semibold text-lg text-primary">
						Technologies
					</h3>
					<div className="flex flex-wrap gap-2">
						{technologies.map((tech) => (
							<Badge key={tech.id} variant="secondary">
								{tech.name}
							</Badge>
						))}
					</div>
				</div>
				<div>
					<h3 className="mb-2 font-semibold text-lg text-primary">
						Learning Outcomes
					</h3>
					<ul className="list-disc space-y-1 pl-5 text-muted-foreground">
						{learningOutcomes.map((outcome) => (
							<li key={outcome.id}>{outcome.value}</li>
						))}
					</ul>
				</div>
				<div className="flex flex-col gap-4 md:flex-row">
					<div className="flex-1">
						<h3 className="mb-2 font-semibold text-lg text-primary">
							Duration
						</h3>
						<p className="text-muted-foreground">8 weeks</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
