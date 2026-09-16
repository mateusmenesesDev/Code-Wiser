'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Textarea } from '~/common/components/ui/textarea';
import type { PeerReviewCalibrationCategory } from '~/features/cohorts/data/peerReviewCalibration';
import { api } from '~/trpc/react';

const formatEventDate = (value: Date | string) =>
	new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(new Date(value));

export default function CohortsPage() {
	const utils = api.useUtils();
	const [feedback, setFeedback] = useState<Record<string, string>>({});
	const [reportReason, setReportReason] = useState<Record<string, string>>({});
	const [reportedReviewIds, setReportedReviewIds] = useState<
		Record<string, boolean>
	>({});
	const [calibrationCohortId, setCalibrationCohortId] = useState<string | null>(
		null
	);
	const [calibrationAnswers, setCalibrationAnswers] = useState<
		Record<string, PeerReviewCalibrationCategory>
	>({});
	const { data, isLoading } = api.cohort.getMyPeerReviews.useQuery();
	const { data: projects } = api.cohort.getMyCohortProjects.useQuery();
	const { data: timeline } = api.cohort.getMyCohortTimeline.useQuery();
	const { data: reputation } = api.cohort.getMyPeerReviewReputation.useQuery();
	const guideCohortId =
		calibrationCohortId ?? data?.assigned[0]?.cohort.id ?? '';
	const { data: calibration, isLoading: calibrationLoading } =
		api.cohort.getPeerReviewCalibration.useQuery(
			{ cohortId: guideCohortId },
			{ enabled: Boolean(guideCohortId) }
		);
	const submitReview = api.cohort.submitPeerReview.useMutation({
		onSuccess: async () => {
			toast.success('Peer review submitted');
			await Promise.all([
				utils.cohort.getMyPeerReviews.invalidate(),
				utils.cohort.getMyPeerReviewReputation.invalidate()
			]);
		},
		onError: (error) => toast.error(error.message)
	});
	const completeCalibration =
		api.cohort.completePeerReviewCalibration.useMutation({
			onSuccess: async (result) => {
				setCalibrationAnswers({});
				if (result.passed) {
					setCalibrationCohortId(null);
					toast.success('Calibration passed. You can now submit feedback.');
				} else {
					toast.error(
						'Calibration not passed yet. Review the guide and try again.'
					);
				}
				await Promise.all([
					utils.cohort.getMyPeerReviews.invalidate(),
					utils.cohort.getPeerReviewCalibration.invalidate()
				]);
			},
			onError: (error) => toast.error(error.message)
		});
	const reportReview = api.cohort.reportPeerReview.useMutation({
		onSuccess: async () => {
			toast.success('Peer review reported');
			await Promise.all([
				utils.cohort.getMyPeerReviews.invalidate(),
				utils.cohort.getMyPeerReviewReputation.invalidate()
			]);
		},
		onError: (error) => toast.error(error.message)
	});

	if (isLoading) {
		return (
			<main className="container mx-auto px-4 py-8 text-muted-foreground">
				Loading cohort work...
			</main>
		);
	}

	const assignedReviews = data?.assigned ?? [];
	const receivedReviews = data?.received ?? [];

	return (
		<main className="container mx-auto space-y-6 px-4 py-8">
			<header>
				<h1 className="font-bold text-3xl">Cohort peer review</h1>
				<p className="mt-2 text-muted-foreground">
					Give specific, respectful feedback to another learner and review what
					your peers noticed in your work.
				</p>
			</header>

			{calibration && (
				<Card>
					<CardHeader>
						<CardTitle>Peer review guide</CardTitle>
						<CardDescription>
							Use the category that best describes the problem and make every
							comment actionable.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-3 md:grid-cols-2">
							{calibration.rubric.map((item) => (
								<div
									key={item.category}
									className="rounded-md border p-3 text-sm"
								>
									<p className="font-medium">
										{item.category} · {item.title}
									</p>
									<p className="mt-1 text-muted-foreground">{item.guidance}</p>
									<p className="mt-2">
										<span className="font-medium">Useful: </span>
										{item.usefulExample}
									</p>
									<p className="mt-1 text-muted-foreground">
										<span className="font-medium">Avoid: </span>
										{item.avoidExample}
									</p>
								</div>
							))}
						</div>
						<div className="rounded-md bg-muted p-4 text-sm">
							<p className="font-medium">Before submitting</p>
							<ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
								{calibration.checklist.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>
						</div>
					</CardContent>
				</Card>
			)}

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Peer review reputation</CardTitle>
						<CardDescription>
							A simple count of feedback submitted and kept after moderation.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-sm">
						<p className="font-semibold text-2xl">{reputation?.score ?? 0}</p>
						<p className="text-muted-foreground">
							{reputation?.submittedCount ?? 0} submitted ·{' '}
							{reputation?.reportedCount ?? 0} reported
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Collaborative projects</CardTitle>
						<CardDescription>
							Projects assigned to your active cohorts.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{(projects ?? []).length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No collaborative projects yet.
							</p>
						) : (
							<ul className="space-y-2 text-sm">
								{projects?.map(({ id, cohort, project }) => (
									<li key={id}>
										<Button asChild variant="link" className="h-auto p-0">
											<Link href={`/workspace/${project.id}`}>
												{project.title} · {cohort.name}
											</Link>
										</Button>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Cohort timeline</CardTitle>
						<CardDescription>
							Kickoff, checkpoints, deliveries, and closing moments.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{(timeline ?? []).length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No cohort events scheduled yet.
							</p>
						) : (
							<ul className="space-y-3 text-sm">
								{timeline?.map((event) => (
									<li key={event.id} className="border-l-2 pl-3">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-medium">{event.title}</span>
											<Badge variant="outline">{event.type}</Badge>
											<Badge variant="secondary">{event.status}</Badge>
										</div>
										<p className="mt-1 text-muted-foreground text-xs">
											{event.cohort.name} · {formatEventDate(event.startsAt)}
										</p>
										{event.description && (
											<p className="mt-1 text-muted-foreground text-xs">
												{event.description}
											</p>
										)}
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>

			<section className="space-y-4">
				<h2 className="font-semibold text-2xl">Reviews to complete</h2>
				{assignedReviews.length === 0 ? (
					<Card>
						<CardContent className="p-6 text-muted-foreground">
							You have no peer reviews waiting.
						</CardContent>
					</Card>
				) : (
					assignedReviews.map((assignment) => (
						<Card key={assignment.id}>
							<CardHeader>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<CardTitle>{assignment.review.title}</CardTitle>
										<CardDescription>
											{assignment.cohort.name} ·{' '}
											{assignment.review.projectTitle} ·{' '}
											{assignment.review.taskTitle}
										</CardDescription>
									</div>
									<Badge variant="outline">{assignment.review.status}</Badge>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								<Button asChild variant="outline" size="sm">
									<Link
										href={assignment.review.prUrl}
										target="_blank"
										rel="noreferrer"
									>
										Open pull request
									</Link>
								</Button>
								{!assignment.calibrationPassed && (
									<div className="space-y-3 rounded-md border border-dashed p-4">
										{calibrationCohortId !== assignment.cohort.id ? (
											<>
												<p className="text-sm">
													Complete the short calibration before sending your
													first review for this cohort.
												</p>
												<Button
													variant="outline"
													onClick={() => {
														setCalibrationCohortId(assignment.cohort.id);
														setCalibrationAnswers({});
													}}
												>
													Start calibration
												</Button>
											</>
										) : calibrationLoading || !calibration ? (
											<p className="text-muted-foreground text-sm">
												Loading calibration...
											</p>
										) : (
											<>
												<div>
													<p className="font-medium text-sm">
														Calibration check
													</p>
													<p className="text-muted-foreground text-xs">
														Choose the most useful category for each scenario.
													</p>
												</div>
												{calibration.prompts.map((prompt) => (
													<fieldset key={prompt.id} className="space-y-2">
														<legend className="text-sm">
															{prompt.scenario}
														</legend>
														<div className="grid gap-2 sm:grid-cols-2">
															{calibration.rubric.map((item) => (
																<label
																	key={item.category}
																	className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs"
																>
																	<input
																		type="radio"
																		name={`${assignment.id}-${prompt.id}`}
																		value={item.category}
																		checked={
																			calibrationAnswers[prompt.id] ===
																			item.category
																		}
																		onChange={() =>
																			setCalibrationAnswers((current) => ({
																				...current,
																				[prompt.id]: item.category
																			}))
																		}
																	/>
																	{item.category}
																</label>
															))}
														</div>
													</fieldset>
												))}
												<Button
													onClick={() =>
														completeCalibration.mutate({
															cohortId: assignment.cohort.id,
															answers: calibration.prompts.map((prompt) => ({
																promptId: prompt.id,
																category:
																	calibrationAnswers[prompt.id] ?? 'CORRECTION'
															}))
														})
													}
													disabled={
														completeCalibration.isPending ||
														!calibration.prompts.every((prompt) =>
															Boolean(calibrationAnswers[prompt.id])
														)
													}
												>
													Check answers
												</Button>
											</>
										)}
									</div>
								)}
								<Textarea
									placeholder="What is clear? What would you improve? Be specific and kind."
									value={feedback[assignment.id] ?? ''}
									onChange={(event) =>
										setFeedback((current) => ({
											...current,
											[assignment.id]: event.target.value
										}))
									}
									maxLength={4000}
								/>
								<div className="flex items-center justify-between gap-3">
									<span className="text-muted-foreground text-xs">
										At least 20 characters
									</span>
									<Button
										onClick={() =>
											submitReview.mutate({
												assignmentId: assignment.id,
												feedback: feedback[assignment.id] ?? ''
											})
										}
										disabled={
											submitReview.isPending ||
											!assignment.calibrationPassed ||
											(feedback[assignment.id] ?? '').trim().length < 20
										}
									>
										Submit feedback
									</Button>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</section>

			<section className="space-y-4">
				<h2 className="font-semibold text-2xl">Feedback on your work</h2>
				{receivedReviews.length === 0 ? (
					<Card>
						<CardContent className="p-6 text-muted-foreground">
							No peer feedback has been submitted yet.
						</CardContent>
					</Card>
				) : (
					receivedReviews.map((assignment) => (
						<Card key={assignment.id}>
							<CardHeader>
								<CardTitle>{assignment.review.title}</CardTitle>
								<CardDescription>
									{assignment.cohort.name} · {assignment.review.projectTitle} ·
									reviewed by {assignment.reviewerName ?? 'a peer'}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<p className="whitespace-pre-wrap text-sm">
									{assignment.feedback}
								</p>
								{reportedReviewIds[assignment.id] ? (
									<p className="text-muted-foreground text-xs">
										Report submitted for moderation.
									</p>
								) : (
									<div className="space-y-2 rounded-md border border-dashed p-3">
										<Textarea
											placeholder="Report a concrete issue with this feedback (at least 10 characters)."
											value={reportReason[assignment.id] ?? ''}
											onChange={(event) =>
												setReportReason((current) => ({
													...current,
													[assignment.id]: event.target.value
												}))
											}
											maxLength={500}
										/>
										<Button
											variant="outline"
											size="sm"
											disabled={
												reportReview.isPending ||
												(reportReason[assignment.id] ?? '').trim().length < 10
											}
											onClick={() =>
												reportReview.mutate(
													{
														assignmentId: assignment.id,
														reason: reportReason[assignment.id] ?? ''
													},
													{
														onSuccess: () =>
															setReportedReviewIds((current) => ({
																...current,
																[assignment.id]: true
															}))
													}
												)
											}
										>
											Report feedback
										</Button>
									</div>
								)}
								<Button asChild variant="outline" size="sm">
									<Link
										href={assignment.review.prUrl}
										target="_blank"
										rel="noreferrer"
									>
										Open pull request
									</Link>
								</Button>
							</CardContent>
						</Card>
					))
				)}
			</section>
		</main>
	);
}
