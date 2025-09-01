'use client';

import { Plus } from 'lucide-react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { CardTitle } from '~/common/components/ui/card';
import { useDialog } from '~/common/hooks/useDialog';
import { cn } from '~/lib/utils';

interface ColumnHeaderProps {
	title: string;
	count: number;
	onCreateTask?: () => void;
	className?: string;
}

export function ColumnHeader({
	title,
	count,
	onCreateTask,
	className
}: ColumnHeaderProps) {
	const { openDialog } = useDialog('task');

	const handleOpenTaskDialog = () => {
		onCreateTask?.();
		openDialog('task');
	};

	return (
		<div
			className={cn(
				'flex items-center justify-between border-b p-2 backdrop-blur-sm transition-all duration-200',
				className
			)}
		>
			<CardTitle
				level={2}
				className="font-semibold text-card-foreground text-sm"
			>
				{title}
				<Badge variant="secondary" className="ml-2">
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
