import { Lock } from 'lucide-react';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';

export default function WorkspaceAccessDenied() {
	return (
		<div className="container mx-auto px-4 py-8">
			<Card className="mx-auto max-w-md">
				<CardHeader className="text-center">
					<Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<CardTitle level={1}>Access Denied</CardTitle>
					<CardDescription>
						You don't have permission to access this project workspace.
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
