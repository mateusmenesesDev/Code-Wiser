'use client';

interface ProjectHeaderProps {
	title: string;
}

export function ProjectHeader({ title }: ProjectHeaderProps) {
	return (
		<header className="border-b bg-background px-6 py-3">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-xl">{title}</h1>
				</div>
			</div>
		</header>
	);
}
