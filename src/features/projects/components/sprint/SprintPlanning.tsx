'use client';

import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/common/components/button';
import { Card } from '~/common/components/card';
import { ScrollArea } from '~/common/components/scroll-area';
import type { Project } from '../../types';
import { NewSprintDialog } from './NewSprintDialog';
import { SprintCard } from './SprintCard';

interface SprintPlanningProps {
	project: Project;
}

export function SprintPlanning({ project }: SprintPlanningProps) {
	const [isNewSprintDialogOpen, setIsNewSprintDialogOpen] = useState(false);

	return (
		<div className="py-6">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-2xl">Sprint Planning</h2>
					<p className="text-muted-foreground">
						Plan and manage your project sprints
					</p>
				</div>
				<Button onClick={() => setIsNewSprintDialogOpen(true)}>
					<PlusCircle className="mr-2 h-4 w-4" />
					New Sprint
				</Button>
			</div>

			<Card>
				<ScrollArea className="h-[calc(100vh-12rem)]">
					<div className="space-y-4 p-4">
						{project.sprints.map((sprint) => (
							<SprintCard key={sprint.id} sprint={sprint} />
						))}
					</div>
				</ScrollArea>
			</Card>

			<NewSprintDialog
				open={isNewSprintDialogOpen}
				onOpenChange={setIsNewSprintDialogOpen}
			/>
		</div>
	);
}
