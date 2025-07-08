'use client';

import { Button } from '~/common/components/ui/button';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from '~/common/components/ui/tabs';

import { ProjectAccessTypeEnum, ProjectMethodologyEnum } from '@prisma/client';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import SprintList from '~/features/sprints/components/SprintList';
import EditTemplateBasicInfo from '~/features/templates/components/EditTemplate/EditTemplateBasicInfo';
import { api } from '~/trpc/react';

const AdminProjectEdit = () => {
	const { id } = useParams();
	const router = useRouter();

	const { data: template, isLoading } = api.projectTemplate.getById.useQuery({
		id: id as string
	});

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!template) {
		return <div>Template not found</div>;
	}

	const initialData = {
		title: template.title,
		description: template.description,
		category: template.category.name,
		difficulty: template.difficulty,
		accessType:
			template.credits && template.credits > 0
				? ProjectAccessTypeEnum.CREDITS
				: ProjectAccessTypeEnum.FREE,
		figmaProjectUrl: template.figmaProjectUrl || '',
		credits: template.credits || 0,
		technologies: template.technologies.map((tech) => tech.name),
		preRequisites: template.preRequisites || [],
		expectedDuration: template.expectedDuration || '',
		learningOutcomes: template.learningOutcomes.map((outcome) => outcome.value),
		milestones: template.milestones.map((milestone) => milestone.title),
		minParticipants: template.minParticipants,
		maxParticipants: template.maxParticipants,
		methodology: template.methodology || ProjectMethodologyEnum.SCRUM
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push('/admin/templates')}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to View
					</Button>
					<div>
						<h1 className="font-bold text-3xl text-foreground">
							Edit Template: {template.title}
						</h1>
					</div>
				</div>
			</div>

			<Tabs defaultValue="template-info" className="space-y-6">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="backlog">Backlog</TabsTrigger>
					<TabsTrigger value="sprints">Sprints</TabsTrigger>
					<TabsTrigger value="epics">Epics</TabsTrigger>
					<TabsTrigger value="template-info">Template Info</TabsTrigger>
				</TabsList>
				<TabsContent value="template-info">
					<EditTemplateBasicInfo
						templateId={template.id}
						initialData={initialData}
					/>
				</TabsContent>
				<TabsContent value="sprints">
					<SprintList projectId={template.id} isTemplate />
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default AdminProjectEdit;
