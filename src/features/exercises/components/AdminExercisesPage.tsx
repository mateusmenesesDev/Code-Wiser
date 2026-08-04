'use client';

import { Protect } from '@clerk/nextjs';
import { Archive, Edit, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
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
import { TrackFormDialog } from './TrackFormDialog';

export default function AdminExercisesPage() {
	const utils = api.useUtils();
	const { data: tracks, isLoading } = api.exercise.adminListTracks.useQuery();
	const [createOpen, setCreateOpen] = useState(false);
	const [editingTrackId, setEditingTrackId] = useState<string | null>(null);

	const createMutation = api.exercise.createTrack.useMutation({
		onSuccess: async () => {
			toast.success('Track created');
			setCreateOpen(false);
			await utils.exercise.adminListTracks.invalidate();
		},
		onError: (error) => toast.error(error.message)
	});

	const updateMutation = api.exercise.updateTrack.useMutation({
		onSuccess: async () => {
			toast.success('Track updated');
			setEditingTrackId(null);
			await utils.exercise.adminListTracks.invalidate();
		},
		onError: (error) => toast.error(error.message)
	});

	const archiveMutation = api.exercise.archiveTrack.useMutation({
		onSuccess: async () => {
			toast.success('Track archived');
			await utils.exercise.adminListTracks.invalidate();
		},
		onError: (error) => toast.error(error.message)
	});

	const editingTrack = tracks?.find((track) => track.id === editingTrackId);

	return (
		// biome-ignore lint/a11y/useValidAriaRole: Clerk Protect uses role for org authorization
		<Protect role="org:admin">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="font-bold text-3xl text-foreground">Exercises</h1>
						<p className="mt-2 text-muted-foreground">
							Manage exercise tracks and their challenges
						</p>
					</div>
					<Button onClick={() => setCreateOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Add track
					</Button>
				</div>

				<Card>
					<CardHeader>
						<CardTitle level={2} className="text-lg">
							Tracks
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<p className="text-muted-foreground">Loading tracks...</p>
						) : !tracks?.length ? (
							<p className="text-muted-foreground">
								No tracks yet. Create React, JavaScript, TypeScript, Lógica de
								programação, Next.js, or Python to get started.
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Slug</TableHead>
										<TableHead>Challenges</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Repo</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{tracks.map((track) => (
										<TableRow key={track.id}>
											<TableCell>
												<Link
													href={`/admin/exercises/${track.id}`}
													className="font-medium hover:underline"
												>
													{track.name}
												</Link>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{track.slug}
											</TableCell>
											<TableCell>{track.challengeCount}</TableCell>
											<TableCell>
												{track.isArchived ? (
													<Badge variant="outline">Archived</Badge>
												) : track.isPublished ? (
													<Badge variant="success">Published</Badge>
												) : (
													<Badge variant="secondary">Draft</Badge>
												)}
											</TableCell>
											<TableCell className="max-w-[220px] truncate text-muted-foreground">
												{track.repoUrl || '—'}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														size="sm"
														variant="outline"
														onClick={() => setEditingTrackId(track.id)}
													>
														<Edit className="h-4 w-4" />
													</Button>
													{!track.isArchived && (
														<ConfirmationDialog
															title="Archive track?"
															description="Archived tracks are hidden from the public catalog. Existing data is kept."
															onConfirm={() =>
																archiveMutation.mutate({ id: track.id })
															}
														>
															<Button
																size="sm"
																variant="outline"
																disabled={archiveMutation.isPending}
															>
																<Archive className="h-4 w-4" />
															</Button>
														</ConfirmationDialog>
													)}
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
					mode="create"
					open={createOpen}
					onOpenChange={setCreateOpen}
					isSubmitting={createMutation.isPending}
					onSubmit={async (values) => {
						await createMutation.mutateAsync(values);
					}}
				/>

				<TrackFormDialog
					mode="edit"
					open={Boolean(editingTrack)}
					onOpenChange={(open) => {
						if (!open) setEditingTrackId(null);
					}}
					isSubmitting={updateMutation.isPending}
					initialValues={editingTrack}
					onSubmit={async (values) => {
						if (!editingTrack) return;
						await updateMutation.mutateAsync({
							id: editingTrack.id,
							...values
						});
					}}
				/>
			</div>
		</Protect>
	);
}
