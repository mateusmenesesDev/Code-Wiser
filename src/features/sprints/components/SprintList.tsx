'use client';

import { Plus, Timer } from 'lucide-react';
import { useCallback, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Accordion } from '~/common/components/ui/accordion';
import { Button } from '~/common/components/ui/button';
import { Dialog } from '~/common/components/ui/dialog';
import { Separator } from '~/common/components/ui/separator';
import { useDialog } from '~/common/hooks/useDialog';
import { api } from '~/trpc/react';
import { useSprintMutations } from '../hooks/useSprintMutations';
import type { SprintApiOutput } from '../types/Sprint.type';
import SprintDialog from './SprintDialog';
import SprintItem from './SprintItem';
interface SprintListProps {
	projectId: string;
	isTemplate?: boolean;
}

const SprintListSkeleton = () => (
	<div className="space-y-4">
		{[1, 2, 3].map((i) => (
			<div key={i} className="animate-pulse rounded-lg border bg-card p-6">
				<div className="space-y-4">
					<div className="flex items-center gap-4">
						<div className="h-5 w-5 rounded-full bg-muted" />
						<div className="space-y-2">
							<div className="h-6 w-48 rounded-md bg-muted" />
							<div className="h-4 w-36 rounded-md bg-muted" />
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="h-6 w-20 rounded-md bg-muted" />
						<div className="h-6 w-24 rounded-md bg-muted" />
					</div>
				</div>
			</div>
		))}
	</div>
);

export default function SprintList({
	projectId,
	isTemplate = false
}: SprintListProps) {
	const [selectedSprint, setSelectedSprint] =
		useState<NonNullable<SprintApiOutput> | null>(null);
	const { openDialog, closeDialog, isDialogOpen } = useDialog('sprint');
	const { deleteSprint } = useSprintMutations({ projectId });
	const [dragState, setDragState] = useState<
		NonNullable<SprintApiOutput>[] | null
	>(null);

	const { data: sprints = [], isLoading } =
		api.sprint.getAllByProjectId.useQuery({
			projectId,
			isTemplate
		});

	const sprintList = dragState ?? sprints;

	const utils = api.useUtils();
	const updateSprintOrder = api.sprint.updateOrder.useMutation({
		onSuccess: () => {
			utils.sprint.getAllByProjectId.invalidate();
		}
	});

	const moveItem = useCallback(
		(dragIndex: number, hoverIndex: number) => {
			setDragState((prevState) => {
				const currentSprints = prevState ?? sprints;
				const newSprints = [...currentSprints];
				const draggedSprint = newSprints[dragIndex];

				if (!draggedSprint) return prevState;

				newSprints.splice(dragIndex, 1);
				newSprints.splice(hoverIndex, 0, draggedSprint);

				return newSprints;
			});
		},
		[sprints]
	);

	const handleDrop = useCallback(() => {
		if (!dragState) return;

		updateSprintOrder.mutate({
			items: dragState.map((sprint, index) => ({
				id: sprint.id,
				order: index
			}))
		});
		setDragState(null);
	}, [dragState, updateSprintOrder]);

	const handleDragStart = useCallback(() => {
		setDragState(sprints);
	}, [sprints]);

	const handleDeleteSprint = (sprintId: string) => {
		deleteSprint.mutate({ id: sprintId });
	};

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<Timer className="h-6 w-6 text-info" />
							<h2 className="font-semibold text-2xl">Sprints</h2>
						</div>
						<p className="text-muted-foreground text-sm">
							Manage and organize your project sprints
						</p>
					</div>
					<Button
						onClick={() => {
							setSelectedSprint(null);
							openDialog('sprint');
						}}
						className="bg-info text-info-foreground hover:bg-info/90"
					>
						<Plus className="mr-2 h-4 w-4" />
						Add Sprint
					</Button>
				</div>

				<Separator />

				{isLoading ? (
					<SprintListSkeleton />
				) : (
					<Accordion type="single" collapsible className="space-y-4">
						{sprintList.map((sprint, index) => (
							<SprintItem
								key={sprint.id}
								sprint={sprint}
								index={index}
								moveItem={moveItem}
								onDrop={handleDrop}
								onDragStart={handleDragStart}
								onEdit={() => {
									setSelectedSprint(sprint);
									openDialog('sprint');
								}}
								onDelete={() => handleDeleteSprint(sprint.id)}
							/>
						))}
						{sprintList.length === 0 && (
							<div className="my-4 flex h-40 flex-col items-center justify-center gap-4 rounded-lg border border-dashed">
								<div className="flex flex-col items-center gap-2 text-center">
									<Timer className="h-12 w-12 text-muted-foreground/50" />
									<div className="space-y-1">
										<p className="font-medium">No sprints yet</p>
										<p className="text-muted-foreground text-sm">
											Create your first sprint to start organizing tasks
										</p>
									</div>
								</div>
								<Button
									variant="outline"
									onClick={() => {
										setSelectedSprint(null);
										openDialog('sprint');
									}}
									className="border-info-border bg-info-muted/50 text-info-muted-foreground hover:bg-info-muted"
								>
									<Plus className="mr-2 h-4 w-4" />
									Create Sprint
								</Button>
							</div>
						)}
					</Accordion>
				)}

				<Dialog open={isDialogOpen} onOpenChange={closeDialog}>
					<SprintDialog
						projectId={projectId}
						sprint={selectedSprint}
						isTemplate={isTemplate}
						onCancel={closeDialog}
					/>
				</Dialog>
			</div>
		</DndProvider>
	);
}
