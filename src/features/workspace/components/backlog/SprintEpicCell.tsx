import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/common/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/common/components/ui/dropdown-menu';

export function SprintEpicCell({
	type,
	value,
	items,
	onUpdate
}: {
	type: 'sprint' | 'epic';
	value: string | null;
	items: Array<{ id: string; title: string }>;
	onUpdate: (id: string | null) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const selectedItem = items.find((item) => item.id === value);

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="group h-7 w-[120px] justify-between gap-1 text-xs"
				>
					<span className="truncate">
						{selectedItem
							? selectedItem.title
							: `Add to ${type === 'sprint' ? 'Sprint' : 'Epic'}`}
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-[200px]">
				{selectedItem && (
					<DropdownMenuItem
						className="text-destructive"
						onClick={() => {
							onUpdate(null);
							setIsOpen(false);
						}}
					>
						<X className="mr-2 h-4 w-4" />
						Remove from {type}
					</DropdownMenuItem>
				)}
				{items.map((item) => (
					<DropdownMenuItem
						key={item.id}
						onClick={() => {
							onUpdate(item.id);
							setIsOpen(false);
						}}
					>
						{item.title}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
