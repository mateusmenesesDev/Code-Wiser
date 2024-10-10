import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/card';

interface Milestone {
	id: number;
	title: string;
	completed: boolean;
}

interface ProjectMilestonesProps {
	milestones: Milestone[];
}

export function ProjectMilestones({ milestones }: ProjectMilestonesProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Project Milestones</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="space-y-4">
					{milestones.map((milestone) => (
						<li key={milestone.id} className="flex items-center">
							<input
								type="checkbox"
								checked={milestone.completed}
								readOnly
								className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
							/>
							<span
								className={
									milestone.completed
										? 'text-muted-foreground line-through'
										: 'text-foreground'
								}
							>
								{milestone.title}
							</span>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
