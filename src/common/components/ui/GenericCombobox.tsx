'use client';

import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import * as React from 'react';
import {
	type Control,
	type FieldValues,
	type Path,
	useController
} from 'react-hook-form';

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
import { cn } from '~/lib/utils';

interface GenericComboboxProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
	options: string[];
	placeholder: string;
	label: string;
	multiple?: boolean;
	disabled?: boolean;
}

export function GenericCombobox<T extends FieldValues>({
	disabled,
	control,
	name,
	options,
	placeholder,
	label,
	multiple = false
}: GenericComboboxProps<T>) {
	const {
		field: { value, onChange }
	} = useController({ name, control });

	const [open, setOpen] = React.useState(false);
	const [inputValue, setInputValue] = React.useState('');

	const handleSelect = (currentValue: string) => {
		if (multiple) {
			const newValue = Array.isArray(value) ? (value as string[]) : [];
			const updatedValue = newValue.includes(currentValue)
				? newValue.filter((v) => v !== currentValue)
				: [...newValue, currentValue];
			onChange(updatedValue);
		} else {
			onChange(currentValue === value ? '' : currentValue);
		}
		setOpen(false);
	};

	const handleAddNew = () => {
		if (inputValue && !options.includes(inputValue)) {
			if (multiple) {
				const newValue = Array.isArray(value)
					? [...(value as string[]), inputValue]
					: [inputValue];
				onChange(newValue);
			} else {
				onChange(inputValue);
			}
			setOpen(false);
			setInputValue('');
		}
	};

	const displayValue = multiple
		? (Array.isArray(value) ? value : []).join(', ')
		: value;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
					disabled={disabled}
				>
					{displayValue || placeholder}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command>
					<CommandInput
						placeholder={`Search ${label.toLowerCase()}...`}
						value={inputValue}
						onValueChange={setInputValue}
					/>
					<CommandList>
						<CommandEmpty className="flex flex-col items-center p-4">
							No {label.toLowerCase()} found.
							<Button
								type="button"
								size="sm"
								className="mt-2"
								onClick={handleAddNew}
							>
								<PlusCircle className="mr-2 h-4 w-4" />
								Add "{inputValue}"
							</Button>
						</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option}
									value={option}
									onSelect={() => handleSelect(option)}
								>
									<Check
										className={cn(
											'mr-2 h-4 w-4',
											multiple
												? Array.isArray(value) && value.includes(option)
													? 'opacity-100'
													: 'opacity-0'
												: value === option
													? 'opacity-100'
													: 'opacity-0'
										)}
									/>
									{option}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
