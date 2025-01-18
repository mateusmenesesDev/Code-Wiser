import { Progress } from '~/common/components/ui/progress';

interface ProjectProgressProps {
	completionRate: number;
}

export function ProjectProgress({ completionRate }: ProjectProgressProps) {
	return (
		<>
			<Progress value={completionRate} className="mb-2" />
			<p className="mb-4 text-muted-foreground text-sm">
				Project {completionRate}% complete
			</p>
		</>
	);
}
