'use client';

import { cn } from '~/lib/utils';

interface ProjectHeaderProps {
	title: string;
	className?: string;
}

export function ProjectHeader({ title, className }: ProjectHeaderProps) {
	return (
		<header className={cn('border-b bg-background px-6 py-3', className)}>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-xl">{title}</h1>
				</div>
			</div>
		</header>
	);
}
