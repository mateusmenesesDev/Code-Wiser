'use client';

import { Check, ChevronsUpDown, X } from 'lucide-react';
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
import { Label } from '~/common/components/ui/label';
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/common/components/ui/popover';
import { cn } from '~/lib/utils';

type MemberOption = {
	id: string;
	name: string | null;
	email: string;
};

interface AssigneesInputProps {
	value: string[];
	onChange: (assigneeIds: string[]) => void;
	members: MemberOption[] | undefined;
	isLoading?: boolean;
}

export function AssigneesInput({
	value,
	onChange,
	members,
	isLoading
}: AssigneesInputProps) {
	const [open, setOpen] = useState(false);

	const selectedMembers =
		members?.filter((member) => value.includes(member.id)) ?? [];

	const toggleAssignee = (memberId: string) => {
		if (value.includes(memberId)) {
			onChange(value.filter((id) => id !== memberId));
			return;
		}
		onChange([...value, memberId]);
	};

	const removeAssignee = (memberId: string) => {
		onChange(value.filter((id) => id !== memberId));
	};

	return (
		<div>
			<Label className="mb-2 block">Assignees</Label>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between font-normal"
						disabled={isLoading}
					>
						<span className="truncate text-muted-foreground">
							{isLoading
								? 'Loading members...'
								: selectedMembers.length > 0
									? `${selectedMembers.length} selected`
									: 'Select assignees'}
						</span>
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
					<Command>
						<CommandInput placeholder="Search members..." />
						<CommandList>
							<CommandEmpty>No members found.</CommandEmpty>
							<CommandGroup>
								{members?.map((member) => {
									const isSelected = value.includes(member.id);
									return (
										<CommandItem
											key={member.id}
											value={`${member.name ?? ''} ${member.email}`}
											onSelect={() => toggleAssignee(member.id)}
										>
											<Check
												className={cn(
													'mr-2 h-4 w-4',
													isSelected ? 'opacity-100' : 'opacity-0'
												)}
											/>
											{member.name || member.email}
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{selectedMembers.length > 0 && (
				<div className="mt-2 flex flex-wrap gap-1">
					{selectedMembers.map((member) => (
						<Badge
							key={member.id}
							variant="secondary"
							className="flex items-center gap-1"
						>
							{member.name || member.email}
							<button
								type="button"
								onClick={() => removeAssignee(member.id)}
								className="hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
				</div>
			)}
		</div>
	);
}
