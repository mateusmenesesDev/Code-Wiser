import { Calendar, CreditCard, Users } from 'lucide-react';
import { Badge } from '~/common/components/ui/badge';
import { Separator } from '~/common/components/ui/separator';
import type { ProjectTemplateApprovalApiResponse } from '../../types/Template.type';

type ProjectTemplateApprovalDetailsProps = {
	project: ProjectTemplateApprovalApiResponse;
};

export function ProjectTemplateApprovalDetails({
	project
}: ProjectTemplateApprovalDetailsProps) {
	if (!project) return null;

	return (
		<div>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<h3 className="mb-2 font-semibold text-lg">Difficulty</h3>
					<Badge variant="outline">{project.difficulty}</Badge>
				</div>
				<div>
					<h3 className="mb-2 font-semibold text-lg">Participants</h3>
					<div className="flex items-center">
						<Users className="mr-2 h-4 w-4" />
						<span>
							Min: {project.minParticipants} - Max: {project.maxParticipants}
						</span>
					</div>
				</div>
				<div>
					<h3 className="mb-2 font-semibold text-lg">Project Type</h3>
					<div className="flex items-center">
						<CreditCard className="mr-2 h-4 w-4" />
						<span className="capitalize">{project.type}</span>
						{project.type === 'CREDITS' && (
							<span className="ml-2">({project.credits} credits)</span>
						)}
					</div>
				</div>
				{project.expectedDuration && (
					<div>
						<h3 className="mb-2 font-semibold text-lg">Duration</h3>
						<div className="flex items-center">
							<Calendar className="mr-2 h-4 w-4" />
							<span>{project.expectedDuration}</span>
						</div>
					</div>
				)}
			</div>
			<Separator className="my-4" />
			{project.learningOutcomes.length > 0 && (
				<div>
					<h3 className="mb-2 font-semibold text-lg">Learning Outcomes</h3>
					<ul className="list-disc pl-5">
						{project.learningOutcomes.map((outcome) => (
							<li key={outcome.id}>{outcome.value}</li>
						))}
					</ul>
				</div>
			)}
			{project.milestones.length > 0 && (
				<>
					<Separator className="my-4" />
					<div>
						<h3 className="mb-2 font-semibold text-lg">Milestones</h3>
						<ul className="list-disc pl-5">
							{project.milestones.map((milestone) => (
								<li key={milestone.id}>{milestone.title}</li>
							))}
						</ul>
					</div>
				</>
			)}
		</div>
	);
}
