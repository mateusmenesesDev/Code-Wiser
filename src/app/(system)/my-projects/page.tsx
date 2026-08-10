'use client';

import { FolderOpen, Mail } from 'lucide-react';
import Link from 'next/link';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent } from '~/common/components/ui/card';
import { MyProjectCard } from '~/features/projects/components/MyProjectCard';
import { MyProjectCardSkeleton } from '~/features/projects/components/MyProjectCardSkeleton';
import { useMyProjects } from '~/features/projects/hooks/useMyProjects';
import { api } from '~/trpc/react';

export default function MyProjectsPage() {
	const { projects, isLoading } = useMyProjects();
	const { data: invitations = [] } =
		api.project.getMyPendingInvitations.useQuery();

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="mb-2 font-bold text-3xl text-foreground">
						My Projects
					</h1>
					<p className="text-muted-foreground">
						Track your progress and continue learning
					</p>
				</div>
				<Button asChild>
					<Link href="/">
						<FolderOpen className="mr-2 h-4 w-4" />
						Browse Projects
					</Link>
				</Button>
			</div>

			{invitations.length > 0 && (
				<div className="mb-8 space-y-3">
					<h2 className="font-semibold text-lg">Pending invitations</h2>
					<div className="grid gap-3">
						{invitations.map((invitation) => (
							<Card key={invitation.id}>
								<CardContent className="flex items-center justify-between gap-4 p-4">
									<div className="flex items-start gap-3">
										<Mail className="mt-1 h-5 w-5 text-muted-foreground" />
										<div>
											<p className="font-medium">{invitation.project.title}</p>
											<p className="text-muted-foreground text-sm">
												{invitation.creditCostSnapshot ?? 0} credits · invited
												by{' '}
												{invitation.invitedBy.name ??
													invitation.invitedBy.email}
											</p>
										</div>
									</div>
									<Button asChild>
										<Link href={`/project-invitations/${invitation.id}`}>
											Review invitation
										</Link>
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			)}

			{isLoading ? (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }, () => (
						<MyProjectCardSkeleton key={crypto.randomUUID()} />
					))}
				</div>
			) : projects.length === 0 ? (
				<Card className="py-16 text-center">
					<CardContent>
						<FolderOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
						<h2 className="mb-2 font-semibold text-lg">
							No projects started yet
						</h2>
						<p className="mb-4 text-muted-foreground text-sm">
							Start your first project to begin your development journey
						</p>
						<Button asChild>
							<Link href="/">Browse Available Projects</Link>
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{projects.map((project) => (
						<MyProjectCard key={project.id} project={project} />
					))}
				</div>
			)}
		</div>
	);
}
