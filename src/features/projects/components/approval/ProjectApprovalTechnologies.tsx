import type { Technology } from '@prisma/client';
import { Label } from '~/common/components/ui/label';
import { Switch } from '~/common/components/ui/switch';
import { useApproval } from '../../hooks/useApproval';

type ProjectApprovalTechnologiesProps = {
	technologies: Technology[];
};

export function ProjectApprovalTechnologies({
	technologies
}: ProjectApprovalTechnologiesProps) {
	const { changeTechnologyApprovalMutation } = useApproval();

	const handleApproveTechnology = (technology: Technology) => {
		changeTechnologyApprovalMutation.mutate({
			technologyName: technology.name,
			approval: !technology.approved
		});
	};

	return (
		<div className="space-y-4">
			{technologies.map((tech) => (
				<div key={tech.id} className="flex items-center justify-between">
					<span>{tech.name}</span>
					<div className="flex items-center space-x-2">
						<Switch
							id={`approve-tech-${tech.id}`}
							onCheckedChange={() => handleApproveTechnology(tech)}
							disabled={changeTechnologyApprovalMutation.isPending}
						/>
						<Label htmlFor={`approve-tech-${tech.id}`}>Approve</Label>
					</div>
				</div>
			))}
		</div>
	);
}
