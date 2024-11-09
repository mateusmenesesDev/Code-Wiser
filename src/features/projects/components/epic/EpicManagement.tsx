'use client';

import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/common/components/button';
import { Card } from '~/common/components/card';
import { ScrollArea } from '~/common/components/scroll-area';
import type { Project } from '../../types';
import { EpicCard } from './EpicCard';
import { NewEpicDialog } from './NewEpicDialog';

interface EpicManagementProps {
	project: Project;
}

export function EpicManagement({ project }: EpicManagementProps) {
	const [isNewEpicDialogOpen, setIsNewEpicDialogOpen] = useState(false);

	return (
		<div className="py-6">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-2xl">Epics</h2>
					<p className="text-muted-foreground">
						Manage your project epics and their associated tasks
					</p>
				</div>
				<Button onClick={() => setIsNewEpicDialogOpen(true)}>
					<PlusCircle className="mr-2 h-4 w-4" />
					New Epic
				</Button>
			</div>

			<Card>
				<ScrollArea className="h-[calc(100vh-12rem)]">
					<div className="space-y-4 p-4">
						{project.epics.map((epic) => (
							<EpicCard key={epic.id} epic={epic} />
						))}
					</div>
				</ScrollArea>
			</Card>

			<NewEpicDialog
				open={isNewEpicDialogOpen}
				onOpenChange={setIsNewEpicDialogOpen}
			/>
		</div>
	);
}
