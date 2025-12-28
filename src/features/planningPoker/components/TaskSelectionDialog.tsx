'use client';

import { Protect } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import { Checkbox } from '~/common/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Label } from '~/common/components/ui/label';
import { api } from '~/trpc/react';

interface TaskSelectionDialogProps {
	projectId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function TaskSelectionDialog({
	projectId,
	open,
	onOpenChange
}: TaskSelectionDialogProps) {
	const router = useRouter();
	const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
		new Set()
	);

	const { data: tasks, isLoading } = api.task.getAllByProjectId.useQuery({
		projectId,
		isTemplate: false
	});

	const createSession = api.planningPoker.createSession.useMutation({
		onSuccess: () => {
			toast.success('Planning Poker session created!');
			onOpenChange(false);
			router.push(`/workspace/${projectId}/planning-poker`);
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to create session');
		}
	});

	const handleToggleTask = (taskId: string) => {
		const newSet = new Set(selectedTaskIds);
		if (newSet.has(taskId)) {
			newSet.delete(taskId);
		} else {
			newSet.add(taskId);
		}
		setSelectedTaskIds(newSet);
	};

	const handleStartSession = () => {
		if (selectedTaskIds.size === 0) {
			toast.error('Please select at least one task');
			return;
		}

		createSession.mutate({
			projectId,
			taskIds: Array.from(selectedTaskIds)
		});
	};

	return (
		// biome-ignore lint/a11y/useValidAriaRole: <explanation>
		<Protect role="org:admin">
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Start Planning Poker</DialogTitle>
						<DialogDescription>
							Select the tasks you want to estimate. You can select multiple
							tasks.
						</DialogDescription>
					</DialogHeader>

					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin" />
						</div>
					) : (
						<div className="space-y-4 py-4">
							{tasks && tasks.length > 0 ? (
								<div className="space-y-3">
									{tasks.map((task) => (
										<div
											key={task.id}
											className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50"
										>
											<Checkbox
												id={task.id}
												checked={selectedTaskIds.has(task.id)}
												onCheckedChange={() => handleToggleTask(task.id)}
											/>
											<Label
												htmlFor={task.id}
												className="flex-1 cursor-pointer space-y-1"
											>
												<div className="font-medium">{task.title}</div>
												{task.description && (
													<div className="line-clamp-2 text-muted-foreground text-sm">
														{task.description
															.replace(/<[^>]*>/g, '')
															.substring(0, 100)}
														{task.description.length > 100 ? '...' : ''}
													</div>
												)}
											</Label>
										</div>
									))}
								</div>
							) : (
								<div className="py-8 text-center text-muted-foreground">
									No tasks available for this project
								</div>
							)}
						</div>
					)}

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={createSession.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={handleStartSession}
							disabled={
								createSession.isPending ||
								selectedTaskIds.size === 0 ||
								isLoading
							}
						>
							{createSession.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								`Start Planning Poker (${selectedTaskIds.size} task${
									selectedTaskIds.size !== 1 ? 's' : ''
								})`
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</Protect>
	);
}
