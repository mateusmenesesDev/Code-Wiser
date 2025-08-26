import { ProjectAccessTypeEnum } from '@prisma/client';
import { Check, ExternalLink, Play, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { useUser } from '~/common/hooks/useUser';
import {
	getBadgeAccessTypeColor,
	getDifficultyBadgeColor
} from '~/common/utils/colorUtils';
import { cn } from '~/lib/utils';
import { useMyProjects } from '../../hooks/useMyProjects';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import type { ProjectTemplateInfoByIdApiOutput } from '../../types/Projects.type';

interface ProjectDetailSidebarProps {
	project: NonNullable<ProjectTemplateInfoByIdApiOutput>;
}

export function ProjectDetailSidebar({ project }: ProjectDetailSidebarProps) {
	const router = useRouter();

	const { isEnrolledProject } = useMyProjects();
	const isEnrolled = isEnrolledProject(project.title);

	const { createProject, isCreateProjectPending } = useProjectMutations();

	const { userCredits, userHasMentorship } = useUser();
	const hasInsufficientCredits =
		project.credits && project.credits > 0 && userCredits < project.credits;
	const isFreeProject = project.accessType === ProjectAccessTypeEnum.FREE;
	const isCreditProject = project.accessType === ProjectAccessTypeEnum.CREDITS;
	const isMentorshipProject =
		project.accessType === ProjectAccessTypeEnum.MENTORSHIP;

	const handleStartProject = () => {
		if (hasInsufficientCredits) {
			toast.error('You need more credits to start this project');
		} else {
			createProject({ projectTemplateId: project.id });
		}
	};

	const isStartProjectDisabled =
		isCreateProjectPending ||
		(isCreditProject && hasInsufficientCredits) ||
		(isMentorshipProject && !userHasMentorship);

	return (
		<div className="sticky top-24">
			<Card className="border-0 shadow-lg">
				<CardHeader>
					<CardTitle className="text-2xl">Ready to Start?</CardTitle>
					<CardDescription>
						Join hundreds of developers building this project
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 p-6">
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								Access Type:
							</span>
							<Badge variant={getBadgeAccessTypeColor(project.accessType)}>
								{project.accessType}
							</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Difficulty:</span>
							<Badge variant={getDifficultyBadgeColor(project.difficulty)}>
								{project.difficulty}
							</Badge>
						</div>
						{/* TODO: Add duration */}
						{/* <div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Duration:</span>
							<span className="font-medium text-sm">
								{project.expectedDuration || '6-8 weeks'}
							</span>
						</div> */}
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								Participants:
							</span>
							<span className="font-medium text-sm">
								{project.minParticipants} min
							</span>
						</div>
						{isCreditProject && (
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">
									Credits Required:
								</span>
								<span
									className={cn(
										'font-medium text-sm',
										hasInsufficientCredits ? 'text-red-600' : 'text-foreground'
									)}
								>
									{project.credits} credits
								</span>
							</div>
						)}
						{isCreditProject && hasInsufficientCredits && (
							<div className="rounded-lg bg-red-50 p-3 text-red-700 text-sm">
								You need {(project.credits || 0) - userCredits} more credits to
								start this project.
							</div>
						)}
					</div>

					{isEnrolled ? (
						<Button
							onClick={() => router.push(`/workspace/${project.id}`)}
							className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-semibold text-lg text-white hover:from-blue-700 hover:to-purple-700"
							size="lg"
						>
							<Check className="mr-2 h-5 w-5" />
							Continue Project
						</Button>
					) : (
						<Button
							onClick={handleStartProject}
							disabled={isStartProjectDisabled}
							className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-semibold text-lg text-white hover:from-blue-700 hover:to-purple-700"
							size="lg"
						>
							<Play className="mr-2 h-5 w-5" />
							{isCreateProjectPending && 'Creating...'}
							{isCreditProject &&
								hasInsufficientCredits &&
								'Insufficient Credits'}
							{isCreditProject && !hasInsufficientCredits && 'Start Project'}
							{isMentorshipProject &&
								!userHasMentorship &&
								'Mentorship Required'}
							{isMentorshipProject && userHasMentorship && 'Start Project'}
							{isFreeProject && 'Start Project'}
						</Button>
					)}

					<Button variant="outline" className="w-full" disabled>
						<ExternalLink className="mr-2 h-4 w-4" />
						Preview Demo (Coming Soon)
					</Button>
				</CardContent>
			</Card>

			{/* Mentor Info */}
			<Card className="mt-6 border-0 shadow-lg">
				<CardHeader>
					<CardTitle className="text-lg">Need Help?</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="mb-4 text-muted-foreground text-sm">
						Get personalized guidance from experienced fullstack developers
						throughout your journey.
					</div>
					<Button variant="outline" className="w-full" disabled>
						<Users className="mr-2 h-4 w-4" />
						Connect with Mentor (Coming Soon)
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
