import { Calendar, Clock, Play } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Progress } from '~/common/components/ui/progress';
import type { UserProjectApiResponse } from '../types/Projects.type';

const getStatusColor = (status: string) => {
	switch (status) {
		case 'In Progress':
			return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
		case 'Near Completion':
			return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
		case 'Not Started':
			return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
		default:
			return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
	}
};

const getDifficultyColor = (difficulty: string) => {
	switch (difficulty) {
		case 'BEGINNER':
			return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
		case 'INTERMEDIATE':
			return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
		case 'ADVANCED':
			return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
		default:
			return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
	}
};

interface ProjectWithProgress extends UserProjectApiResponse {
	progress: number;
	status: 'In Progress' | 'Near Completion' | 'Not Started';
	lastActivity: string;
}

type MyProjectCardProps = {
	project: ProjectWithProgress;
};

export function MyProjectCard({ project }: MyProjectCardProps) {
	return (
		<Card className="transition-shadow hover:shadow-lg">
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="mb-2 text-lg">{project.title}</CardTitle>
						<CardDescription className="line-clamp-2">
							{project.description}
						</CardDescription>
					</div>
					<Badge className={getStatusColor(project.status)} variant="outline">
						{project.status}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				<div>
					<div className="mb-2 flex items-center justify-between text-muted-foreground text-sm">
						<span>Progress</span>
						<span>{project.progress}%</span>
					</div>
					<Progress value={project.progress} className="h-2" />
				</div>

				<div className="flex items-center justify-between">
					<Badge
						variant="outline"
						className={getDifficultyColor(project.difficulty)}
					>
						{project.difficulty}
					</Badge>
					<Badge variant="secondary">
						{project.category?.name || 'General'}
					</Badge>
				</div>

				<div className="flex items-center gap-4 text-muted-foreground text-sm">
					<div className="flex items-center gap-1">
						<Calendar className="h-3 w-3" />
						<span>
							Started {new Date(project.createdAt).toLocaleDateString()}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-1 text-muted-foreground text-sm">
					<Clock className="h-3 w-3" />
					<span>Last activity: {project.lastActivity}</span>
				</div>

				<Button asChild className="w-full">
					<Link href={`/workspace/${project.slug}`}>
						<Play className="mr-2 h-4 w-4" />
						Continue Project
					</Link>
				</Button>
			</CardContent>
		</Card>
	);
}
