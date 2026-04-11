'use client';

import { ProjectMethodologyEnum } from '@prisma/client';
import { Kanban, LayoutList } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import { Textarea } from '~/common/components/ui/textarea';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '~/common/components/ui/tooltip';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';

interface ProjectSettingsModalProps {
	projectId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ProjectSettingsModal({
	projectId,
	open,
	onOpenChange
}: ProjectSettingsModalProps) {
	const utils = api.useUtils();

	const { data: projectInfo } = api.project.getWorkspaceInfo.useQuery(
		{ id: projectId },
		{ enabled: open }
	);

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [methodology, setMethodology] = useState<ProjectMethodologyEnum>(
		ProjectMethodologyEnum.SCRUM
	);

	useEffect(() => {
		if (projectInfo) {
			setTitle(projectInfo.title);
			setDescription(projectInfo.description ?? '');
			setMethodology(projectInfo.methodology);
		}
	}, [projectInfo]);

	const updateProject = api.project.updateProject.useMutation({
		onSuccess: async () => {
			await utils.project.getWorkspaceInfo.invalidate({ id: projectId });
			toast.success('Project settings saved');
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message ?? 'Failed to save settings');
		}
	});

	const handleSave = () => {
		updateProject.mutate({ id: projectId, title, description, methodology });
	};

	const methodologyOptions = [
		{
			value: ProjectMethodologyEnum.SCRUM,
			label: 'Scrum',
			description: 'Work in sprints with a backlog, sprint planning, and velocity tracking.',
			icon: LayoutList
		},
		{
			value: ProjectMethodologyEnum.KANBAN,
			label: 'Kanban',
			description: 'Continuous flow board without sprints. All tasks are visible at once.',
			icon: Kanban,
			warning: 'Switching to Kanban hides sprint navigation. No data is deleted.'
		}
	];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Project Settings</DialogTitle>
					<DialogDescription>
						Update your project's view type and general information.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-2">
					<div className="space-y-3">
						<Label className='font-semibold text-sm'>View Type</Label>
						<div className="grid grid-cols-2 gap-3">
							<TooltipProvider>
								{methodologyOptions.map((option) => {
									const Icon = option.icon;
									const isSelected = methodology === option.value;
									const card = (
										<button
											key={option.value}
											type="button"
											onClick={() => setMethodology(option.value)}
											className={cn(
												'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:border-primary/60',
												isSelected
													? 'border-primary bg-primary/5 ring-1 ring-primary'
													: 'border-border bg-card'
											)}
										>
											<div className="flex items-center gap-2">
												<Icon className="h-4 w-4" />
												<span className="font-medium text-sm">{option.label}</span>
											</div>
											<p className="text-muted-foreground text-xs leading-relaxed">
												{option.description}
											</p>
										</button>
									);

									if (option.warning) {
										return (
											<Tooltip key={option.value}>
												<TooltipTrigger asChild>{card}</TooltipTrigger>
												<TooltipContent side="bottom" className="max-w-[220px] text-center text-xs">
													{option.warning}
												</TooltipContent>
											</Tooltip>
										);
									}

									return card;
								})}
							</TooltipProvider>
						</div>
					</div>

					<div className="space-y-3">
						<Label className='font-semibold text-sm'>General</Label>
						<div className="space-y-3">
							<div className="space-y-1.5">
								<Label htmlFor="project-title" className='text-muted-foreground text-sm'>
									Title
								</Label>
								<Input
									id="project-title"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Project title"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="project-description" className='text-muted-foreground text-sm'>
									Description
								</Label>
								<Textarea
									id="project-description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Project description"
									rows={3}
									className="resize-none"
								/>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={updateProject.isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={updateProject.isPending || !title.trim()}
					>
						{updateProject.isPending ? 'Saving…' : 'Save'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
