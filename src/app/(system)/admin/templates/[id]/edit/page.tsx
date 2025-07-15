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
import EpicList from '~/features/epics/components/EpicList/EpicList';
import SprintList from '~/features/sprints/components/SprintList';
import EditTemplateBasicInfo from '~/features/templates/components/EditTemplate/EditTemplateBasicInfo';
import EditTemplateImages from '~/features/templates/components/EditTemplate/EditTemplateImages';
import Backlog from '~/features/workspace/components/backlog/Backlog';
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
		...template,
		category: template.category.name,
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
		methodology: template.methodology || ProjectMethodologyEnum.SCRUM,
		images: template.images.map((image) => ({
			url: image.url,
			alt: image.alt || ''
		}))
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

			<Tabs defaultValue="backlog" className="space-y-6">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="backlog">Backlog</TabsTrigger>
					<TabsTrigger value="sprints">Sprints</TabsTrigger>
					<TabsTrigger value="epics">Epics</TabsTrigger>
					<TabsTrigger value="template-info">Template Info</TabsTrigger>
					<TabsTrigger value="images">Images</TabsTrigger>
				</TabsList>
				<TabsContent value="backlog">
					<Backlog projectId={template.id} />
				</TabsContent>
				<TabsContent value="epics">
					<EpicList projectId={template.id} isTemplate />
				</TabsContent>
				<TabsContent value="sprints">
					<SprintList projectId={template.id} isTemplate />
				</TabsContent>
				<TabsContent value="template-info">
					<EditTemplateBasicInfo
						templateId={template.id}
						initialData={initialData}
					/>
				</TabsContent>
				<TabsContent value="images">
					<EditTemplateImages templateId={template.id} />
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default AdminProjectEdit;
