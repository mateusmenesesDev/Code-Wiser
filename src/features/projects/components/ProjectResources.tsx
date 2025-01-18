import { Award, BookOpen, Clock, GitBranch, Star } from 'lucide-react';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';

export function ProjectResources() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Project Resources</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4">
					<Button
						variant="outline"
						className="justify-start text-foreground hover:text-primary"
					>
						<GitBranch className="mr-2 h-4 w-4" />
						Project Repository
					</Button>
					<Button
						variant="outline"
						className="justify-start text-foreground hover:text-primary"
					>
						<BookOpen className="mr-2 h-4 w-4" />
						Project Documentation
					</Button>
					<Button
						variant="outline"
						className="justify-start text-foreground hover:text-primary"
					>
						<Star className="mr-2 h-4 w-4" />
						Recommended Tutorials
					</Button>
					<Button
						variant="outline"
						className="justify-start text-foreground hover:text-primary"
					>
						<Award className="mr-2 h-4 w-4" />
						Best Practices Guide
					</Button>
					<Button
						variant="outline"
						className="justify-start text-foreground hover:text-primary"
					>
						<Clock className="mr-2 h-4 w-4" />
						Project Timeline
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
