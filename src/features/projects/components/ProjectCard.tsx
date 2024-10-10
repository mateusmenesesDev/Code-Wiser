import { ArrowRight, CreditCard, Eye, Play, Users } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '~/common/components/badge';
import { Button } from '~/common/components/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '~/common/components/card';
import type { Project } from '../types/Projects.type';

type ProjectCardProps = {
	project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
	return (
		<Card className="flex flex-col">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg">{project.title}</CardTitle>
					<Badge variant="outline" className="ml-2">
						{project.difficulty}
					</Badge>
				</div>
				<CardDescription className="mt-2">
					{project.description}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="secondary">{project.category}</Badge>
					<div className="flex items-center space-x-2 text-muted-foreground text-sm">
						<Users className="h-4 w-4" />
						<span>{project.participants} participants</span>
					</div>
					<div className="flex items-center space-x-2 text-muted-foreground text-sm">
						<CreditCard className="h-4 w-4" />
						<span>
							{project.credits > 0 ? `${project.credits} credits` : 'Free'}
						</span>
					</div>
				</div>
			</CardContent>
			<CardFooter className="mt-auto flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
				{project.status && (
					<Badge
						variant={project.status === 'Started' ? 'default' : 'secondary'}
						className="w-full text-center sm:w-auto"
					>
						{project.status}
					</Badge>
				)}
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					{project.status !== 'Started' && project.status !== 'Completed' && (
						<Button size="sm" className="w-full sm:w-auto">
							<Play className="mr-2 h-4 w-4" />
							Start
						</Button>
					)}
					{project.status === 'Started' && (
						<Button
							variant="default"
							size="sm"
							asChild
							className="w-full sm:w-auto"
						>
							<Link href="#">
								<ArrowRight className="mr-2 h-4 w-4" />
								Continue
							</Link>
						</Button>
					)}

					<Button
						variant="outline"
						size="sm"
						asChild
						className="w-full sm:w-auto"
					>
						<Link href={`/projects/${project.id}`}>
							<Eye className="mr-2 h-4 w-4" />
							See More
						</Link>
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
