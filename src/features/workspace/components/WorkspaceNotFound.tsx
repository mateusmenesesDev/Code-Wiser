import { AlertTriangle } from 'lucide-react';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';

export default function WorkspaceNotFound() {
	return (
		<div className="container mx-auto px-4 py-8">
			<Card className="mx-auto max-w-md">
				<CardHeader className="text-center">
					<AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<CardTitle level={1}>Project Not Found</CardTitle>
					<CardDescription>
						The project you're looking for doesn't exist or has been removed.
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center">
					<Button variant="outline" onClick={() => window.history.back()}>
						Go Back
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
