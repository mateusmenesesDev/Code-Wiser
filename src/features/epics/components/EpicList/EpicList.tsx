'use client';

import { Lightbulb, Plus } from 'lucide-react';
import { useState } from 'react';
import { Accordion } from '~/common/components/ui/accordion';
import { Button } from '~/common/components/ui/button';
import { Dialog } from '~/common/components/ui/dialog';
import { Separator } from '~/common/components/ui/separator';
import { useDialog } from '~/common/hooks/useDialog';
import { api } from '~/trpc/react';
import type { EpicApiOutput } from '../../types/Epic.type';
import EpicDialog from '../EpicDialog';
import EpicItem from './EpicItem';
import { EpicListSkeleton } from './EpicListSkeleton';

interface EpicListProps {
	projectId: string;
	isTemplate?: boolean;
}

export default function EpicList({
	projectId,
	isTemplate = false
}: EpicListProps) {
	const [selectedEpic, setSelectedEpic] = useState<EpicApiOutput | null>(null);
	const { openDialog, closeDialog, isDialogOpen } = useDialog('epic');

	const { data: epics = [], isLoading } = api.epic.getAllByProjectId.useQuery({
		projectId,
		isTemplate
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Lightbulb className="h-6 w-6 text-purple-500" />
						<h2 className="font-semibold text-2xl">Epics</h2>
					</div>
					<p className="text-muted-foreground text-sm">
						Organize large features and related tasks into epics
					</p>
				</div>
				<Button
					onClick={() => {
						setSelectedEpic(null);
						openDialog('epic');
					}}
					className="bg-purple-500 text-white hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700"
				>
					<Plus className="mr-2 h-4 w-4" />
					Add Epic
				</Button>
			</div>

			<Separator />

			{isLoading ? (
				<EpicListSkeleton />
			) : (
				<Accordion type="single" collapsible className="space-y-4">
					{epics.map((epic) => (
						<EpicItem
							key={epic.id}
							epic={epic}
							onEdit={() => {
								setSelectedEpic(epic);
								openDialog('epic');
							}}
						/>
					))}
					{epics.length === 0 && (
						<div className="my-4 flex h-40 flex-col items-center justify-center gap-4 rounded-lg border border-dashed">
							<div className="flex flex-col items-center gap-2 text-center">
								<Lightbulb className="h-12 w-12 text-muted-foreground/50" />
								<div className="space-y-1">
									<p className="font-medium">No epics yet</p>
									<p className="text-muted-foreground text-sm">
										Create your first epic to organize related features and
										tasks
									</p>
								</div>
							</div>
							<Button
								variant="outline"
								onClick={() => {
									setSelectedEpic(null);
									openDialog('epic');
								}}
								className="border-purple-200 bg-purple-50/50 text-purple-600 hover:bg-purple-100 dark:border-purple-900/50 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30"
							>
								<Plus className="mr-2 h-4 w-4" />
								Create Epic
							</Button>
						</div>
					)}
				</Accordion>
			)}

			<Dialog open={isDialogOpen} onOpenChange={closeDialog}>
				<EpicDialog
					projectId={projectId}
					epic={selectedEpic}
					isTemplate={isTemplate}
				/>
			</Dialog>
		</div>
	);
}
