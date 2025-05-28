import { ProjectStatusEnum } from '@prisma/client';
import { Check, CreditCard, Eye, Loader2, Play, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { cn } from '~/lib/utils';
import { useApproval } from '../../templates/hook/useApproval';
import { useProjectMutations } from '../hooks/useProjectMutations';
import type { ProjectTemplateApiResponse } from '../types/Projects.type';

type ProjectCardProps = {
	projectTemplate: ProjectTemplateApiResponse;
	approvalPage?: boolean;
	userCredits: number;
	status?: ProjectStatusEnum;
	isEnrolled?: boolean;
};

export function ProjectCard({
	projectTemplate,
	userCredits,
	approvalPage = false,
	isEnrolled = false
}: ProjectCardProps) {
	const router = useRouter();
	const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
	const { changeProjectApprovalMutation } = useApproval();
	const { createProjectAsync, isCreateProjectPending } = useProjectMutations();

	const handleApprove = (approval: boolean) => {
		changeProjectApprovalMutation.mutate({
			projectName: projectTemplate.title,
			approval: approval ? 'APPROVED' : 'REQUESTED_CHANGES'
		});
	};

	const handleContinue = () => {
		router.push(`/projects/${projectTemplate.slug}`);
	};

	const handleCreateProject = async () => {
		toast.promise(
			createProjectAsync({
				projectTemplateId: projectTemplate.id
			}),
			{
				loading: 'Creating project...',
				success: 'Project created successfully',
				error: 'Failed to create project'
			}
		);
	};

	return (
		<>
			<Card className="flex flex-col">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg">{projectTemplate.title}</CardTitle>
						<Badge variant="outline" className="ml-2">
							{projectTemplate.difficulty}
						</Badge>
					</div>
					<CardDescription className="mt-2">
						{projectTemplate.description}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">{projectTemplate.category.name}</Badge>
						<div className="flex items-center space-x-2 text-muted-foreground text-sm">
							<Users className="h-4 w-4" />
							<span>{projectTemplate.minParticipants} participants</span>
						</div>
						<div
							className={cn(
								'flex items-center space-x-2 text-muted-foreground text-sm',
								{
									'text-destructive':
										projectTemplate.credits &&
										projectTemplate.credits > 0 &&
										userCredits &&
										userCredits < projectTemplate.credits
								}
							)}
						>
							<CreditCard className="h-4 w-4" />
							<span>
								{projectTemplate.credits && projectTemplate.credits > 0
									? `${projectTemplate.credits} credits`
									: 'Free'}
							</span>
						</div>
					</div>
				</CardContent>
				<CardFooter className="mt-auto flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						{approvalPage &&
							projectTemplate.status !== ProjectStatusEnum.APPROVED && (
								<Button
									size="sm"
									onClick={() => setIsApprovalModalOpen(true)}
									className="w-full sm:w-auto"
								>
									<Check className="mr-2 h-4 w-4" />
									Approve
								</Button>
							)}
						{!approvalPage && isEnrolled ? (
							<Button
								size="sm"
								className="w-full sm:w-auto"
								onClick={handleContinue}
							>
								<Check className="mr-2 h-4 w-4" />
								Continue
							</Button>
						) : (
							<Button
								size="sm"
								className="w-full sm:w-auto"
								onClick={handleCreateProject}
								disabled={isCreateProjectPending}
							>
								{isCreateProjectPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Play className="mr-2 h-4 w-4" />
								)}
								Start
							</Button>
						)}
						<Button
							variant="outline"
							size="sm"
							asChild
							className="w-full sm:w-auto"
						>
							<Link
								href={
									approvalPage
										? `/projects/templates/${projectTemplate.slug}/approval`
										: `/projects/templates/${projectTemplate.slug}`
								}
							>
								<Eye className="mr-2 h-4 w-4" />
								See More
							</Link>
						</Button>
					</div>
				</CardFooter>
			</Card>

			<Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Approve Project</DialogTitle>
						<DialogDescription>
							Are you sure you want to approve "{projectTemplate.title}"?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsApprovalModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={() => handleApprove(true)}
							disabled={changeProjectApprovalMutation.isPending}
						>
							{changeProjectApprovalMutation.isPending
								? 'Approving...'
								: 'Approve'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
