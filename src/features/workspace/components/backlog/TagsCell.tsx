import { X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '~/common/components/ui/badge';
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
import { api } from '~/trpc/react';

interface TagsCellProps {
	tags: string[];
	taskId: string;
	projectId: string;
}

export function TagsCell({ tags, taskId, projectId }: TagsCellProps) {
	const [open, setOpen] = useState(false);
	const [inputValue, setInputValue] = useState('');

	const utils = api.useUtils();
	const updateTaskMutation = api.task.update.useMutation({
		onSuccess: () => {
			utils.projectTemplate.getById.invalidate({ id: projectId });
		}
	});

	const handleAddTag = async () => {
		if (!inputValue.trim()) return;

		const newTags = [...tags, inputValue.trim()];
		await updateTaskMutation.mutate({
			id: taskId,
			tags: newTags
		});
		setInputValue('');
		setOpen(false);
	};

	const handleRemoveTag = async (tagToRemove: string) => {
		const newTags = tags.filter((tag) => tag !== tagToRemove);
		await updateTaskMutation.mutate({
			id: taskId,
			tags: newTags
		});
	};

	return (
		<div className="flex flex-wrap gap-1">
			{tags.map((tag) => (
				<Badge
					key={tag}
					variant="secondary"
					className="flex items-center bg-muted/60 text-muted-foreground text-xs hover:bg-muted/80"
				>
					{tag}
					<Button
						variant="ghost"
						className="ml-1 h-auto p-0"
						onClick={() => handleRemoveTag(tag)}
					>
						<X className="h-3 w-3" />
					</Button>
				</Badge>
			))}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button variant="ghost" className="h-6 px-2 text-xs">
						+ Add Tag
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[200px] p-0">
					<Command>
						<CommandInput
							placeholder="Type a tag..."
							value={inputValue}
							onValueChange={setInputValue}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									handleAddTag();
								}
							}}
						/>
						<CommandList>
							<CommandEmpty>Press enter to add tag</CommandEmpty>
							<CommandGroup>
								{inputValue && (
									<CommandItem
										onSelect={handleAddTag}
										className="cursor-pointer"
									>
										Add "{inputValue}"
									</CommandItem>
								)}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
