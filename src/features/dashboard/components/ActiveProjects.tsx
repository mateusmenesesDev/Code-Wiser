import Link from 'next/link';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Progress } from '~/common/components/ui/progress';
import { activeProjects } from '../mocks/dashboardData';

export function ActiveProjects() {
	return (
		<Card className="flex min-h-[300px] flex-col">
			<CardHeader>
				<CardTitle>Active Projects</CardTitle>
				<CardDescription>Your ongoing project collaborations</CardDescription>
			</CardHeader>
			<CardContent>
				{activeProjects.map((project) => (
					<div key={project.id} className="mb-4 last:mb-0">
						<div className="mb-1 flex items-center justify-between">
							<span className="font-medium text-sm">{project.name}</span>
							<Badge variant="secondary">{project.progress}%</Badge>
						</div>
						<Progress value={project.progress} className="h-2" />
						<div className="mt-1 text-muted-foreground text-xs">
							Mentor: {project.mentor}
						</div>
					</div>
				))}
			</CardContent>
			<CardFooter className="mt-auto">
				<Button asChild>
					<Link href="/projects">View All Projects</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}
