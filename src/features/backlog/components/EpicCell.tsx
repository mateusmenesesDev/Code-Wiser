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
import { useTask } from '~/features/task/hooks/useTask';
import { cn } from '~/lib/utils';
import { useIsTemplate } from '~/common/hooks/useIsTemplate';

interface EpicCellProps {
	epicId: string | null;
	taskId: string;
	projectId: string;
	epics: Array<{ id: string; title: string }> | undefined;
}

export function EpicCell({ epicId, taskId, projectId, epics }: EpicCellProps) {
	const isTemplate = useIsTemplate();
	const [open, setOpen] = useState(false);

	const { updateTask } = useTask({ projectId });

	const availableEpics = epics || [];
	const selectedEpic = availableEpics.find((epic) => epic.id === epicId);

	const handleEpicSelect = async (epicId: string | undefined) => {
		updateTask({
			id: taskId,
			epicId,
			isTemplate
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
					{selectedEpic?.title || 'No epic'}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput placeholder="Search epic..." />
					<CommandList>
						<CommandEmpty>No epic found.</CommandEmpty>
						<CommandGroup>
							<CommandItem
								onSelect={() => handleEpicSelect(undefined)}
								className="cursor-pointer"
							>
								<Check
									className={cn(
										'mr-2 h-4 w-4',
										!epicId ? 'opacity-100' : 'opacity-0'
									)}
								/>
								No epic
							</CommandItem>
							{availableEpics.map((epic) => (
								<CommandItem
									key={epic.id}
									onSelect={() => handleEpicSelect(epic.id)}
									className="cursor-pointer"
								>
									<Check
										className={cn(
											'mr-2 h-4 w-4',
											epicId === epic.id ? 'opacity-100' : 'opacity-0'
										)}
									/>
									{epic.title}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
