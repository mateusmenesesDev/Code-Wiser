'use client';

import { PlusCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Button } from '~/common/components/ui/button';
import { Card } from '~/common/components/ui/card';
import { ScrollArea } from '~/common/components/ui/scroll-area';
import { useDialog } from '~/common/hooks/useDialog';
import type { RouterOutputs } from '~/trpc/react';
import { api } from '~/trpc/react';
import { NewSprintDialog } from './NewSprintDialog';
import { SprintCard } from './SprintCard';
import { SprintPlanningSkeleton } from './SprintPlanningSkeleton';

interface SprintPlanningProps {
	sprints?: RouterOutputs['sprint']['getAllByProjectSlug'];
}

export function SprintPlanning({ sprints }: SprintPlanningProps) {
	const params = useParams();
	const { data, isLoading } = api.sprint.getAllByProjectTemplateSlug.useQuery(
		{
			projectTemplateSlug: params.slug as string
		},
		{
			enabled: !!params.slug,
			initialData: sprints
		}
	);
	const { openDialog } = useDialog();

	return (
		<div className="py-6">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-2xl">Sprint Planning</h2>
					<p className="text-muted-foreground">
						Plan and manage your project sprints
					</p>
				</div>
				<Button disabled={isLoading} onClick={() => openDialog('sprint')}>
					<PlusCircle className="mr-2 h-4 w-4" />
					New Sprint
				</Button>
			</div>

			{isLoading && !data && <SprintPlanningSkeleton />}

			{!isLoading && data && (
				<Card>
					<ScrollArea className="h-[calc(100vh-12rem)]">
						<div className="space-y-4 p-4">
							{data?.map((sprint) => (
								<SprintCard key={sprint.id} sprint={sprint} />
							))}
						</div>
					</ScrollArea>
				</Card>
			)}

			<NewSprintDialog />
		</div>
	);
}
