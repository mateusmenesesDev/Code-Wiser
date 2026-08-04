'use client';

import { Protect } from '@clerk/nextjs';
import type { ExerciseChallengeDifficulty } from '@prisma/client';
import { ArrowDown, ArrowLeft, ArrowUp, Archive, Edit, Plus } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
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
import { DIFFICULTY_LABELS, difficultyBadgeVariant } from '../lib/difficulty';
import { ChallengeFormDialog } from './ChallengeFormDialog';
import { TrackFormDialog } from './TrackFormDialog';

type AdminExerciseTrackPageProps = {
	trackId: string;
};

export default function AdminExerciseTrackPage({
	trackId
}: AdminExerciseTrackPageProps) {
	const utils = api.useUtils();
	const { data: track, isLoading } = api.exercise.adminGetTrack.useQuery({
		id: trackId
	});
	const [editTrackOpen, setEditTrackOpen] = useState(false);
	const [createChallengeOpen, setCreateChallengeOpen] = useState(false);
	const [editingChallengeId, setEditingChallengeId] = useState<string | null>(
		null
	);

	const updateTrackMutation = api.exercise.updateTrack.useMutation({
		onSuccess: async () => {
			toast.success('Track updated');
			setEditTrackOpen(false);
			await utils.exercise.adminGetTrack.invalidate({ id: trackId });
			await utils.exercise.adminListTracks.invalidate();
		},
		onError: (error) => toast.error(error.message)
	});

	const createChallengeMutation = api.exercise.createChallenge.useMutation({
		onSuccess: async () => {
			toast.success('Challenge created');
			setCreateChallengeOpen(false);
			await utils.exercise.adminGetTrack.invalidate({ id: trackId });
		},
		onError: (error) => toast.error(error.message)
	});

	const updateChallengeMutation = api.exercise.updateChallenge.useMutation({
		onSuccess: async () => {
			toast.success('Challenge updated');
			setEditingChallengeId(null);
			await utils.exercise.adminGetTrack.invalidate({ id: trackId });
		},
		onError: (error) => toast.error(error.message)
	});

	const archiveChallengeMutation = api.exercise.archiveChallenge.useMutation({
		onSuccess: async () => {
			toast.success('Challenge archived');
			await utils.exercise.adminGetTrack.invalidate({ id: trackId });
		},
		onError: (error) => toast.error(error.message)
	});

	const reorderMutation = api.exercise.reorderChallenges.useMutation({
		onSuccess: async () => {
			await utils.exercise.adminGetTrack.invalidate({ id: trackId });
		},
		onError: (error) => toast.error(error.message)
	});

	const activeChallenges = useMemo(
		() => track?.challenges.filter((challenge) => !challenge.isArchived) ?? [],
		[track?.challenges]
	);

	const editingChallenge = track?.challenges.find(
		(challenge) => challenge.id === editingChallengeId
	);

	const moveChallenge = (
		challengeId: string,
		difficulty: ExerciseChallengeDifficulty,
		direction: -1 | 1
	) => {
		const group = activeChallenges.filter((c) => c.difficulty === difficulty);
		const index = group.findIndex((c) => c.id === challengeId);
		const targetIndex = index + direction;
		if (index < 0 || targetIndex < 0 || targetIndex >= group.length) return;

		const ordered = group.map((c) => c.id);
		const [moved] = ordered.splice(index, 1);
		if (!moved) return;
		ordered.splice(targetIndex, 0, moved);

		reorderMutation.mutate({
			trackId,
			difficulty,
			orderedChallengeIds: ordered
		});
	};

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8 text-muted-foreground">
				Loading track...
			</div>
		);
	}

	if (!track) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-muted-foreground">Track not found.</p>
				<Button asChild variant="outline" className="mt-4">
					<Link href="/admin/exercises">Back</Link>
				</Button>
			</div>
		);
	}

	return (
		// biome-ignore lint/a11y/useValidAriaRole: Clerk Protect uses role for org authorization
		<Protect role="org:admin">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-6">
					<Button asChild variant="ghost" size="sm" className="mb-4">
						<Link href="/admin/exercises">
							<ArrowLeft className="mr-2 h-4 w-4" />
							All tracks
						</Link>
					</Button>
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<div className="flex items-center gap-3">
								<h1 className="font-bold text-3xl text-foreground">
									{track.name}
								</h1>
								{track.isArchived ? (
									<Badge variant="outline">Archived</Badge>
								) : track.isPublished ? (
									<Badge variant="success">Published</Badge>
								) : (
									<Badge variant="secondary">Draft</Badge>
								)}
							</div>
							<p className="mt-2 max-w-2xl text-muted-foreground">
								{track.description}
							</p>
							<p className="mt-2 text-muted-foreground text-sm">
								Repo:{' '}
								{track.repoUrl ? (
									<a
										href={track.repoUrl}
										target="_blank"
										rel="noreferrer"
										className="underline"
									>
										{track.repoUrl}
									</a>
								) : (
									'not set (not cloneable)'
								)}
							</p>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setEditTrackOpen(true)}>
								<Edit className="mr-2 h-4 w-4" />
								Edit track
							</Button>
							<Button onClick={() => setCreateChallengeOpen(true)}>
								<Plus className="mr-2 h-4 w-4" />
								Add challenge
							</Button>
						</div>
					</div>
				</div>

				<Card>
					<CardHeader>
						<CardTitle level={2} className="text-lg">
							Challenges
						</CardTitle>
					</CardHeader>
					<CardContent>
						{activeChallenges.length === 0 ? (
							<p className="text-muted-foreground">
								No challenges yet. Add the first exercise for this track.
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Title</TableHead>
										<TableHead>Difficulty</TableHead>
										<TableHead>Slug</TableHead>
										<TableHead>Order</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{activeChallenges.map((challenge) => (
										<TableRow key={challenge.id}>
											<TableCell className="font-medium">
												{challenge.title}
											</TableCell>
											<TableCell>
												<Badge
													variant={difficultyBadgeVariant(challenge.difficulty)}
												>
													{DIFFICULTY_LABELS[challenge.difficulty]}
												</Badge>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{challenge.slug}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1">
													<Button
														size="icon"
														variant="ghost"
														onClick={() =>
															moveChallenge(
																challenge.id,
																challenge.difficulty,
																-1
															)
														}
														disabled={reorderMutation.isPending}
													>
														<ArrowUp className="h-4 w-4" />
													</Button>
													<Button
														size="icon"
														variant="ghost"
														onClick={() =>
															moveChallenge(
																challenge.id,
																challenge.difficulty,
																1
															)
														}
														disabled={reorderMutation.isPending}
													>
														<ArrowDown className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														size="sm"
														variant="outline"
														onClick={() =>
															setEditingChallengeId(challenge.id)
														}
													>
														<Edit className="h-4 w-4" />
													</Button>
													<ConfirmationDialog
														title="Archive challenge?"
														description="Archived challenges are hidden from the public catalog."
														onConfirm={() =>
															archiveChallengeMutation.mutate({
																id: challenge.id
															})
														}
													>
														<Button
															size="sm"
															variant="outline"
															disabled={archiveChallengeMutation.isPending}
														>
															<Archive className="h-4 w-4" />
														</Button>
													</ConfirmationDialog>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>

				<TrackFormDialog
					mode="edit"
					open={editTrackOpen}
					onOpenChange={setEditTrackOpen}
					isSubmitting={updateTrackMutation.isPending}
					initialValues={track}
					onSubmit={async (values) => {
						await updateTrackMutation.mutateAsync({
							id: track.id,
							...values
						});
					}}
				/>

				<ChallengeFormDialog
					mode="create"
					open={createChallengeOpen}
					onOpenChange={setCreateChallengeOpen}
					isSubmitting={createChallengeMutation.isPending}
					onSubmit={async (values) => {
						await createChallengeMutation.mutateAsync({
							trackId,
							...values
						});
					}}
				/>

				<ChallengeFormDialog
					mode="edit"
					open={Boolean(editingChallenge)}
					onOpenChange={(open) => {
						if (!open) setEditingChallengeId(null);
					}}
					isSubmitting={updateChallengeMutation.isPending}
					initialValues={editingChallenge}
					onSubmit={async (values) => {
						if (!editingChallenge) return;
						await updateChallengeMutation.mutateAsync({
							id: editingChallenge.id,
							...values
						});
					}}
				/>
			</div>
		</Protect>
	);
}
