'use client';

import { Plus } from 'lucide-react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { CardTitle } from '~/common/components/ui/card';
import { useDialog } from '~/common/hooks/useDialog';

interface ColumnHeaderProps {
	title: string;
	count: number;
}

export function ColumnHeader({ title, count }: ColumnHeaderProps) {
	const { openDialog } = useDialog('task');

	const handleOpenTaskDialog = () => {
		openDialog('task');
	};

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
				onClick={handleOpenTaskDialog}
			>
				<Plus className="h-4 w-4" />
			</Button>
		</div>
	);
}
