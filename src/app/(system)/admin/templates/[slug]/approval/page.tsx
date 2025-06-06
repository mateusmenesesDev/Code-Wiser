'use client';

import { CheckCircle2, Pencil, XCircle } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ProjectStatusEnum } from '@prisma/client';
import { api } from '~/trpc/react';

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
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from '~/common/components/ui/tabs';

import { ProjectTemplateApprovalCategory } from '~/features/templates/components/approval/ProjectTemplateApprovalCategory';
import { ProjectTemplateApprovalDetails } from '~/features/templates/components/approval/ProjectTemplateApprovalDetails';
import { ProjectTemplateApprovalTechnologies } from '~/features/templates/components/approval/ProjectTemplateApprovalTechnologies';
import { ProjectTemplateRequestChanges } from '~/features/templates/components/approval/ProjectTemplateRequestChanges';

import { useApproval } from '~/features/templates/hook/useApproval';

export default function ProjectApprovalPage({
	params: { slug }
}: { params: { slug: string } }) {
	const router = useRouter();
	const [isRequestChangesOpen, setIsRequestChangesOpen] = useState(false);

	const { data: project } = api.projectTemplate.getBySlug.useQuery({
		slug
	});

	const { changeProjectApprovalMutation, requestChangesMutation } =
		useApproval();

	if (!project) return null;

	const handleApprovalProject = (approval: boolean) => {
		changeProjectApprovalMutation.mutate({
			id: project.id,
			status: approval ? 'APPROVED' : 'REJECTED'
		});
	};

	const handleRequestChanges = (feedback: string) => {
		requestChangesMutation.mutate(
			{
				projectId: project.id,
				feedback
			},
			{
				onSuccess: () => {
					setIsRequestChangesOpen(false);
				}
			}
		);
	};

	return (
		<div className="mx-auto px-4 py-8">
			<h1 className="mb-8 font-bold text-3xl text-primary">
				Project Approval Dashboard
			</h1>
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div>
							<CardTitle className="text-2xl text-primary">
								{project.title}
							</CardTitle>
							<CardDescription>{project.description}</CardDescription>
						</div>
						<Badge
							variant={
								project.status === ProjectStatusEnum.APPROVED
									? 'default'
									: project.status === ProjectStatusEnum.REJECTED
										? 'destructive'
										: 'secondary'
							}
							className="text-sm"
						>
							{project.status.charAt(0).toUpperCase() + project.status.slice(1)}
						</Badge>
					</div>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="details">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="details">Project Details</TabsTrigger>
							<TabsTrigger value="technologies">Technologies</TabsTrigger>
							<TabsTrigger value="category">Category</TabsTrigger>
						</TabsList>
						<TabsContent value="details" className="mt-4">
							<ProjectTemplateApprovalDetails project={project} />
						</TabsContent>
						<TabsContent value="technologies" className="mt-4">
							<ProjectTemplateApprovalTechnologies
								technologies={project.technologies}
							/>
						</TabsContent>
						<TabsContent value="category" className="mt-4">
							<ProjectTemplateApprovalCategory category={project.category} />
						</TabsContent>
					</Tabs>
				</CardContent>
				<CardFooter className="flex justify-end space-x-2">
					<Button
						variant="outline"
						onClick={() => handleApprovalProject(false)}
						disabled={
							project.status === ProjectStatusEnum.PENDING ||
							changeProjectApprovalMutation.isPending
						}
					>
						<XCircle className="mr-2 h-4 w-4" />
						Reject Project
					</Button>
					<Button
						variant="outline"
						onClick={() =>
							router.push(`/projects/templates/${project.slug}/edit/backlog`)
						}
					>
						<Pencil className="mr-2 h-4 w-4" />
						Edit Project
					</Button>
					<Button
						variant="outline"
						onClick={() => setIsRequestChangesOpen(true)}
						disabled={changeProjectApprovalMutation.isPending}
					>
						<Pencil className="mr-2 h-4 w-4" />
						Request Changes
					</Button>
					<Button
						onClick={() => handleApprovalProject(true)}
						disabled={
							project.status === ProjectStatusEnum.APPROVED ||
							changeProjectApprovalMutation.isPending
						}
					>
						<CheckCircle2 className="mr-2 h-4 w-4" />
						Approve Project
					</Button>
				</CardFooter>
			</Card>

			<ProjectTemplateRequestChanges
				isOpen={isRequestChangesOpen}
				onClose={() => setIsRequestChangesOpen(false)}
				onSubmit={handleRequestChanges}
				projectTitle={project.title}
				isLoading={requestChangesMutation.isPending}
			/>
		</div>
	);
}
