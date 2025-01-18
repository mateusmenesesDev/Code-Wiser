'use client';

import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/common/components/ui/button';
import { Card } from '~/common/components/ui/card';
import { ScrollArea } from '~/common/components/ui/scroll-area';
import { api } from '~/trpc/react';
import { EpicCard } from './EpicCard';
import { NewEpicDialog } from './NewEpicDialog';

interface EpicManagementProps {
	projectId: string;
	isTemplate: boolean;
}

export function EpicManagement({ projectId }: EpicManagementProps) {
	const [isOpen, setIsOpen] = useState(false);

	// TODO: add project query
	// const query = isTemplate ? api.projectTemplate.epic.getEpics : api.project.epic.getEpics;

	const { data: epics } = api.projectTemplate.epic.getEpics.useQuery(projectId);

	if (!epics) return null;

	return (
		<div className="py-6">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-2xl">Epics</h2>
					<p className="text-muted-foreground">
						Manage your project epics and their associated tasks
					</p>
				</div>
				<Button onClick={() => setIsOpen(true)}>
					<PlusCircle className="mr-2 h-4 w-4" />
					New Epic
				</Button>
			</div>

			<Card>
				<ScrollArea className="h-[calc(100vh-22rem)]">
					<div className="space-y-4 p-4">
						{epics.map((epic) => (
							<EpicCard key={epic.id} epic={epic} />
						))}
					</div>
				</ScrollArea>
			</Card>

			<NewEpicDialog
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				projectId={projectId}
			/>
		</div>
	);
}
