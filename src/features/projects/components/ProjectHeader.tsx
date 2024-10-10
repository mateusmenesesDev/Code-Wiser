import { Button } from '~/common/components/button';
import {
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/card';

interface ProjectHeaderProps {
	title: string;
	description: string;
}

export function ProjectHeader({ title, description }: ProjectHeaderProps) {
	return (
		<CardHeader>
			<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<div>
					<CardTitle className="mb-2 text-3xl text-primary">{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</div>
				<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
					Join Project
				</Button>
			</div>
		</CardHeader>
	);
}
