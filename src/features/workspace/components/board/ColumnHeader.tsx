'use client';

import { Plus } from 'lucide-react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { CardTitle } from '~/common/components/ui/card';

interface ColumnHeaderProps {
	title: string;
	count: number;
	onAddTask?: () => void;
}

export function ColumnHeader({ title, count, onAddTask }: ColumnHeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<CardTitle className="font-semibold text-card-foreground text-sm">
				{title}
				<Badge
					variant="secondary"
					className="ml-2 bg-background/50 text-foreground"
				>
					{count}
				</Badge>
			</CardTitle>
			<Button
				variant="ghost"
				size="sm"
				className="h-7 w-7 p-0 hover:bg-background/20"
				onClick={onAddTask}
			>
				<Plus className="h-4 w-4" />
			</Button>
		</div>
	);
}
