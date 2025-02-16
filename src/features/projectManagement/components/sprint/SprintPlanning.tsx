'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '~/common/components/ui/button';
import { Card } from '~/common/components/ui/card';
import { ScrollArea } from '~/common/components/ui/scroll-area';
import { useDialog } from '~/common/hooks/useDialog';
import type { RouterOutputs } from '~/trpc/react';
import { NewSprintDialog } from './NewSprintDialog';
import { SprintCard } from './SprintCard';

interface SprintPlanningProps {
	sprints: RouterOutputs['projectTemplate']['sprint']['getAllSprints'];
}

export function SprintPlanning({ sprints }: SprintPlanningProps) {
	const { setIsDialogOpen, isDialogOpen } = useDialog();

	return (
		<div className="py-6">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-2xl">Sprint Planning</h2>
					<p className="text-muted-foreground">
						Plan and manage your project sprints
					</p>
				</div>
				<Button onClick={() => setIsDialogOpen(true)}>
					<PlusCircle className="mr-2 h-4 w-4" />
					New Sprint
				</Button>
			</div>

			<Card>
				<ScrollArea className="h-[calc(100vh-12rem)]">
					<div className="space-y-4 p-4">
						{sprints.map((sprint) => (
							<SprintCard key={sprint.id} sprint={sprint} />
						))}
					</div>
				</ScrollArea>
			</Card>

			<NewSprintDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
		</div>
	);
}
