'use client';

import { Protect } from '@clerk/nextjs';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';
import { api } from '~/trpc/react';

function formatDate(value: Date | string) {
	return new Date(value).toLocaleString();
}

export default function AdminExerciseReviewsPage() {
	const { data: submissions, isLoading } =
		api.exercise.adminListReviewQueue.useQuery(undefined, {
			refetchOnMount: true,
			refetchOnWindowFocus: true
		});

	return (
		// biome-ignore lint/a11y/useValidAriaRole: Clerk Protect uses role for org authorization
		<Protect role="org:admin">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-8">
					<h1 className="font-bold text-3xl text-foreground">
						Exercise Reviews
					</h1>
					<p className="mt-2 text-muted-foreground">
						Review mentee exercise pull requests. Separate from project task PR
						reviews.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle level={2} className="text-lg">
							Needs attention
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<p className="text-muted-foreground">Loading queue...</p>
						) : !submissions?.length ? (
							<p className="text-muted-foreground">
								No exercise reviews waiting right now.
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Track</TableHead>
										<TableHead>Student</TableHead>
										<TableHead>Challenges</TableHead>
										<TableHead>PR</TableHead>
										<TableHead>Submitted</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{submissions.map((submission) => (
										<TableRow key={submission.id}>
											<TableCell className="font-medium">
												{submission.track.name}
											</TableCell>
											<TableCell>
												<div>
													<p>{submission.submittedBy.name || 'Unnamed'}</p>
													<p className="text-muted-foreground text-sm">
														{submission.submittedBy.email}
													</p>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-1">
													{submission.decisions.map((decision) => (
														<Badge
															key={decision.id}
															variant={
																decision.status === 'PENDING'
																	? 'warning'
																	: decision.status === 'APPROVED'
																		? 'success'
																		: 'destructive'
															}
														>
															{decision.challenge.title}
														</Badge>
													))}
												</div>
											</TableCell>
											<TableCell>
												<a
													href={submission.prUrl}
													target="_blank"
													rel="noreferrer"
													className="inline-flex items-center gap-1 text-sm underline"
												>
													Open PR
													<ExternalLink className="h-3.5 w-3.5" />
												</a>
											</TableCell>
											<TableCell className="text-muted-foreground text-sm">
												{formatDate(submission.createdAt)}
											</TableCell>
											<TableCell className="text-right">
												<Button asChild size="sm">
													<Link
														href={`/admin/exercise-reviews/${submission.id}`}
													>
														Review
													</Link>
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>
		</Protect>
	);
}
