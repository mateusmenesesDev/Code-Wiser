'use client';

import {
	PRReviewAnalysisStatus,
	PRReviewFindingDecision,
	PRReviewFindingSeverity
} from '@prisma/client';
import { Check, Loader2, Save, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '~/common/components/ui/alert';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Textarea } from '~/common/components/ui/textarea';
import { api } from '~/trpc/react';

interface AIReviewDialogProps {
	reviewId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUseAccepted: (comment: string, analysisId: string) => void;
}

type Draft = {
	problem: string;
	justification: string;
	suggestion: string;
};

const severityLabel: Record<PRReviewFindingSeverity, string> = {
	[PRReviewFindingSeverity.LOW]: 'Low',
	[PRReviewFindingSeverity.MEDIUM]: 'Medium',
	[PRReviewFindingSeverity.HIGH]: 'High',
	[PRReviewFindingSeverity.CRITICAL]: 'Critical'
};

function acceptedComment(
	findings: Array<{
		id: string;
		filePath: string;
		line: number | null;
		severity: PRReviewFindingSeverity;
		problem: string;
		justification: string;
		suggestion: string;
		decision: PRReviewFindingDecision;
	}>,
	drafts: Record<string, Draft>
) {
	return findings
		.filter((finding) => finding.decision === PRReviewFindingDecision.ACCEPTED)
		.map((finding) => {
			const draft = drafts[finding.id] ?? {
				problem: finding.problem,
				justification: finding.justification,
				suggestion: finding.suggestion
			};
			return `- [${severityLabel[finding.severity]}] ${finding.filePath}${finding.line ? `:${finding.line}` : ''}\n  Problem: ${draft.problem}\n  Why: ${draft.justification}\n  Suggestion: ${draft.suggestion}`;
		})
		.join('\n\n');
}

export function AIReviewDialog({
	reviewId,
	open,
	onOpenChange,
	onUseAccepted
}: AIReviewDialogProps) {
	const utils = api.useUtils();
	const analysisQuery = api.prReview.getLatestAIAnalysis.useQuery(
		{ reviewId },
		{
			enabled: open,
			refetchInterval: (query) => {
				const analysis = query.state.data;
				if (
					!analysis ||
					analysis.status === PRReviewAnalysisStatus.COMPLETED ||
					analysis.status === PRReviewAnalysisStatus.FAILED
				) {
					return false;
				}
				return Date.now() - analysis.createdAt.getTime() < 10 * 60 * 1000
					? 3_000
					: false;
			}
		}
	);
	const updateFinding = api.prReview.reviewAIFinding.useMutation({
		onSuccess: () => {
			void utils.prReview.getLatestAIAnalysis.invalidate({ reviewId });
		}
	});
	const [drafts, setDrafts] = useState<Record<string, Draft>>({});

	useEffect(() => {
		if (!analysisQuery.data) return;
		setDrafts(
			Object.fromEntries(
				analysisQuery.data.findings.map((finding) => [
					finding.id,
					{
						problem: finding.editedProblem ?? finding.problem,
						justification: finding.editedJustification ?? finding.justification,
						suggestion: finding.editedSuggestion ?? finding.suggestion
					}
				])
			)
		);
	}, [analysisQuery.data]);

	const acceptedCount = useMemo(
		() =>
			analysisQuery.data?.findings.filter(
				(finding) => finding.decision === PRReviewFindingDecision.ACCEPTED
			).length ?? 0,
		[analysisQuery.data]
	);

	const saveFinding = (findingId: string) => {
		const draft = drafts[findingId];
		if (!draft) return;
		updateFinding.mutate({ findingId, ...draft });
	};

	const decideFinding = (
		findingId: string,
		decision: 'ACCEPTED' | 'DISCARDED'
	) => {
		const draft = drafts[findingId];
		updateFinding.mutate({ findingId, decision, ...draft });
	};

	const analysis = analysisQuery.data;
	const isRunning =
		analysis?.status === PRReviewAnalysisStatus.QUEUED ||
		analysis?.status === PRReviewAnalysisStatus.RUNNING;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Sparkles className="h-5 w-5" />
						AI-assisted analysis
					</DialogTitle>
					<DialogDescription>
						Review every suggestion. The analysis does not approve a pull
						request.
					</DialogDescription>
				</DialogHeader>

				{analysisQuery.isLoading && (
					<div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
						<Loader2 className="h-4 w-4 animate-spin" /> Loading analysis…
					</div>
				)}

				{isRunning && (
					<Alert>
						<Loader2 className="h-4 w-4 animate-spin" />
						<AlertDescription>
							The analysis is running in the background. This dialog refreshes
							for up to ten minutes.
						</AlertDescription>
					</Alert>
				)}

				{analysis?.status === PRReviewAnalysisStatus.FAILED && (
					<Alert variant="destructive">
						<AlertDescription>
							{analysis.errorMessage ??
								'The analysis failed. Start it again to retry.'}
						</AlertDescription>
					</Alert>
				)}

				{analysis?.status === PRReviewAnalysisStatus.COMPLETED && (
					<div className="space-y-4">
						<div className="flex items-center justify-between text-muted-foreground text-sm">
							<span>
								{analysis.findings.length} finding(s) · {analysis.includedFiles}{' '}
								file(s) analyzed
							</span>
							{analysis.wasTruncated && (
								<Badge variant="warning">Partial diff</Badge>
							)}
						</div>

						{analysis.findings.length === 0 && (
							<Alert>
								<AlertDescription>
									No actionable findings were returned for the submitted diff.
								</AlertDescription>
							</Alert>
						)}

						{analysis.findings.map((finding) => {
							const draft = drafts[finding.id] ?? {
								problem: finding.editedProblem ?? finding.problem,
								justification:
									finding.editedJustification ?? finding.justification,
								suggestion: finding.editedSuggestion ?? finding.suggestion
							};
							return (
								<div
									key={finding.id}
									className="space-y-3 rounded-lg border p-4"
								>
									<div className="flex flex-wrap items-center gap-2">
										<Badge variant="outline">
											{
												severityLabel[
													finding.editedSeverity ?? finding.severity
												]
											}
										</Badge>
										<Badge variant="secondary">
											{finding.editedCategory ?? finding.category}
										</Badge>
										<span className="font-mono text-muted-foreground text-xs">
											{finding.filePath}
											{finding.line ? `:${finding.line}` : ''}
										</span>
									</div>
									<Textarea
										value={draft.problem}
										onChange={(event) =>
											setDrafts((current) => ({
												...current,
												[finding.id]: { ...draft, problem: event.target.value }
											}))
										}
										aria-label={`Problem in ${finding.filePath}`}
										placeholder="Problem"
									/>
									<Textarea
										value={draft.justification}
										onChange={(event) =>
											setDrafts((current) => ({
												...current,
												[finding.id]: {
													...draft,
													justification: event.target.value
												}
											}))
										}
										aria-label={`Why ${finding.filePath} is a problem`}
										placeholder="Justification"
									/>
									<Textarea
										value={draft.suggestion}
										onChange={(event) =>
											setDrafts((current) => ({
												...current,
												[finding.id]: {
													...draft,
													suggestion: event.target.value
												}
											}))
										}
										aria-label={`Suggestion for ${finding.filePath}`}
										placeholder="Suggestion"
									/>
									<div className="flex flex-wrap justify-end gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => saveFinding(finding.id)}
											disabled={updateFinding.isPending}
										>
											<Save className="mr-2 h-4 w-4" /> Save edit
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												decideFinding(
													finding.id,
													PRReviewFindingDecision.DISCARDED
												)
											}
											disabled={updateFinding.isPending}
										>
											<X className="mr-2 h-4 w-4" /> Discard
										</Button>
										<Button
											variant={
												finding.decision === PRReviewFindingDecision.ACCEPTED
													? 'default'
													: 'secondary'
											}
											size="sm"
											onClick={() =>
												decideFinding(
													finding.id,
													PRReviewFindingDecision.ACCEPTED
												)
											}
											disabled={updateFinding.isPending}
										>
											<Check className="mr-2 h-4 w-4" /> Accept
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				)}

				<DialogFooter>
					{analysis?.status === PRReviewAnalysisStatus.COMPLETED &&
						acceptedCount > 0 && (
							<Button
								onClick={() =>
									onUseAccepted(
										acceptedComment(analysis.findings, drafts),
										analysis.id
									)
								}
							>
								Use accepted findings in Request Changes
							</Button>
						)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
