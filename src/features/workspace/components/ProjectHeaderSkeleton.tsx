import { ArrowLeft, MessageSquare, Settings } from 'lucide-react';
import { Button } from '~/common/components/ui/button';
import { Skeleton } from '~/common/components/ui/skeleton';

export function ProjectHeaderSkeleton() {
	return (
		<section className="mb-8 flex items-center justify-between">
			<div className="flex items-center gap-4">
				<Button variant="ghost" disabled>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Projects
				</Button>
				<div>
					<Skeleton className="mb-2 h-9 w-64" />
					<p className="text-muted-foreground">Workspace</p>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<Button variant="outline" size="sm" disabled>
					<MessageSquare className="mr-2 h-4 w-4" />
					Ask Mentor
				</Button>
				<Button variant="outline" size="sm" disabled>
					<Settings className="mr-2 h-4 w-4" />
					Settings
				</Button>
			</div>
		</section>
	);
}
