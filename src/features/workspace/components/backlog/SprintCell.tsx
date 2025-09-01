import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/common/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from '~/common/components/ui/command';
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/common/components/ui/popover';
import { useTask } from '~/features/workspace/hooks/useTask';
import { cn } from '~/lib/utils';

interface SprintCellProps {
	sprintId: string | null;
	taskId: string;
	projectId: string;
	sprints: Array<{ id: string; title: string }> | undefined;
}

export function SprintCell({
	sprintId,
	taskId,
	projectId,
	sprints
}: SprintCellProps) {
	const [open, setOpen] = useState(false);

	const { updateTask } = useTask({ projectId });

	const availableSprints = sprints || [];
	const selectedSprint = availableSprints.find(
		(sprint) => sprint.id === sprintId
	);

	const handleSprintSelect = async (sprintId: string | undefined) => {
		updateTask({
			id: taskId,
			sprintId
		});
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between font-normal"
				>
					{selectedSprint?.title || 'No sprint'}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput placeholder="Search sprint..." />
					<CommandList>
						<CommandEmpty>No sprint found.</CommandEmpty>
						<CommandGroup>
							<CommandItem
								onSelect={() => handleSprintSelect(undefined)}
								className="cursor-pointer"
							>
								<Check
									className={cn(
										'mr-2 h-4 w-4',
										!sprintId ? 'opacity-100' : 'opacity-0'
									)}
								/>
								No sprint
							</CommandItem>
							{availableSprints.map((sprint) => (
								<CommandItem
									key={sprint.id}
									onSelect={() => handleSprintSelect(sprint.id)}
									className="cursor-pointer"
								>
									<Check
										className={cn(
											'mr-2 h-4 w-4',
											sprintId === sprint.id ? 'opacity-100' : 'opacity-0'
										)}
									/>
									{sprint.title}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
