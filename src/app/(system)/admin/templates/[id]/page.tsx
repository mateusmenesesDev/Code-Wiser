'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent } from '~/common/components/ui/card';
import { ProjectHeader } from '~/features/projects/components/ProjectHeader';
import { CloneTemplateDialog } from '~/features/templates/components/CloneTemplateDialog';
import { api } from '~/trpc/react';

export default function ProjectPage({
	params: { id }
}: {
	params: { id: string };
}) {
	const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);

	const { data: project, isLoading } = api.projectTemplate.getById.useQuery({
		id
	});

	if (isLoading) return <div>Loading...</div>;

	if (!project) return <div>Project not found</div>;

	return (
		<div className="mx-auto bg-background py-8 text-foreground">
			<div className="px-4">
				<Card className="mb-8">
					<div className="flex items-center justify-between border-b p-4">
						<ProjectHeader title={project.title} className="border-none" />
						<Button
							variant="outline"
							onClick={() => setIsCloneDialogOpen(true)}
						>
							<Copy className="mr-2 h-4 w-4" />
							Clonar Template
						</Button>
					</div>
					<CardContent>Soon...</CardContent>
				</Card>
			</div>

			<CloneTemplateDialog
				open={isCloneDialogOpen}
				onOpenChange={setIsCloneDialogOpen}
				templateId={id}
				templateTitle={project.title}
			/>
		</div>
	);
}
