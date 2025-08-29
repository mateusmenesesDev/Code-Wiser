import { ArrowLeft, ExternalLink, MessageSquare, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '~/common/components/ui/button';

interface ProjectHeaderProps {
	projectTitle?: string;
	figmaProjectUrl?: string;
}

export function ProjectHeader({
	projectTitle,
	figmaProjectUrl
}: ProjectHeaderProps) {
	const router = useRouter();

	return (
		<section className="mb-4 flex items-center justify-between">
			<div className="flex items-center gap-4">
				<Button variant="ghost" onClick={() => router.back()}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Projects
				</Button>
				<div>
					<h1 className="font-bold text-3xl">{projectTitle}</h1>
					<p className="text-muted-foreground">Workspace</p>
				</div>
			</div>

			<div className="flex items-center gap-2">
				{figmaProjectUrl && (
					<Button asChild variant="primary" size="sm">
						<a href={figmaProjectUrl} target="_blank" rel="noopener noreferrer">
							<ExternalLink className="mr-2 h-4 w-4" />
							Figma Project
						</a>
					</Button>
				)}
				<Button variant="outline" size="sm" disabled>
					<MessageSquare className="mr-2 h-4 w-4" />
					Ask Mentor (Coming Soon)
				</Button>
				<Button
					disabled
					variant="outline"
					size="sm"
					onClick={() => router.push('/project-settings')}
				>
					<Settings className="mr-2 h-4 w-4" />
					Settings (Coming Soon)
				</Button>
			</div>
		</section>
	);
}
