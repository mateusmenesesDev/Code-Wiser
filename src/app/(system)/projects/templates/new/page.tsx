'use client';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import ProjectForm from '~/features/projects/components/newProjectTemplate/ProjectTemplateForm';

export default function NewProjectPage() {
	return (
		<div className="mx-auto bg-background px-4 py-8 text-foreground">
			<Card>
				<CardHeader>
					<CardTitle className="font-bold text-3xl text-primary">
						Create New Project
					</CardTitle>
					<CardDescription>
						Fill in the details to create a new project on MentorMatch
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ProjectForm />
				</CardContent>
			</Card>
		</div>
	);
}
