'use client';

import { CheckCircle2, ExternalLink, Lock, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Checkbox } from '~/common/components/ui/checkbox';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import { Switch } from '~/common/components/ui/switch';
import { Textarea } from '~/common/components/ui/textarea';
import { api } from '~/trpc/react';

export function ProjectPortfolioSettings({
	projectId,
	open
}: {
	projectId: string;
	open: boolean;
}) {
	const utils = api.useUtils();
	const { data: portfolio, isLoading } =
		api.project.getPortfolioSettings.useQuery({ projectId }, { enabled: open });
	const [summary, setSummary] = useState('');
	const [demoUrl, setDemoUrl] = useState('');
	const [published, setPublished] = useState(false);
	const [showDemo, setShowDemo] = useState(false);
	const [showRepository, setShowRepository] = useState(false);
	const [relevantTaskIds, setRelevantTaskIds] = useState<string[]>([]);
	const [feedback, setFeedback] = useState('');

	useEffect(() => {
		if (!portfolio) return;
		setSummary(portfolio.portfolioSummary ?? '');
		setDemoUrl(portfolio.portfolioDemoUrl ?? '');
		setPublished(portfolio.portfolioPublishedAt !== null);
		setShowDemo(portfolio.portfolioShowDemo);
		setShowRepository(
			portfolio.portfolioShowRepository &&
			portfolio.githubRepository !== null &&
			!portfolio.githubRepository.private
		);
		setRelevantTaskIds(
			portfolio.tasks
				.filter((task) => task.portfolioRelevant)
				.map((task) => task.id)
		);
		setFeedback(portfolio.portfolioFeedback ?? '');
	}, [portfolio]);

	const updatePortfolio = api.project.updatePortfolio.useMutation({
		onSuccess: async () => {
			await utils.project.getPortfolioSettings.invalidate({ projectId });
			toast.success('Portfolio settings saved');
		},
		onError: (error) => toast.error(error.message)
	});
	const evaluatePortfolio = api.project.evaluatePortfolio.useMutation({
		onSuccess: async () => {
			await utils.project.getPortfolioSettings.invalidate({ projectId });
			toast.success('Mentor feedback saved');
		},
		onError: (error) => toast.error(error.message)
	});

	if (!open || isLoading || !portfolio) return null;
	if (!portfolio.canManage && !portfolio.canEvaluate) return null;

	const repositoryCanBeShown =
		portfolio.githubRepository !== null && !portfolio.githubRepository.private;
	const toggleRelevantTask = (taskId: string) => {
		setRelevantTaskIds((current) =>
			current.includes(taskId)
				? current.filter((id) => id !== taskId)
				: [...current, taskId]
		);
	};

	return (
		<div className="space-y-4 border-t pt-5">
			<div className="flex items-center gap-2">
				<Share2 className="h-4 w-4 text-primary" />
				<div>
					<Label className="font-semibold text-sm">Portfolio</Label>
					<p className="text-muted-foreground text-xs">
						Turn this project into a public learning artifact.
					</p>
				</div>
			</div>

			{portfolio.canManage && (
				<>
					<div className="space-y-1.5">
						<Label htmlFor="portfolio-summary">Public summary</Label>
						<Textarea
							id="portfolio-summary"
							value={summary}
							onChange={(event) => setSummary(event.target.value)}
							placeholder="What did you build and what did you learn?"
							maxLength={5000}
							rows={4}
							className="resize-none"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="portfolio-demo-url">Demo URL</Label>
						<Input
							id="portfolio-demo-url"
							value={demoUrl}
							onChange={(event) => setDemoUrl(event.target.value)}
							placeholder="https://example.com"
							type="url"
						/>
					</div>

					<div className="space-y-3 rounded-md border p-3">
						<div className="flex items-center justify-between gap-3">
							<div>
								<Label htmlFor="portfolio-published">Publish portfolio</Label>
								<p className="text-muted-foreground text-xs">
									{portfolio.publicCode
										? `/portfolio/${portfolio.publicCode}`
										: 'This project has no public identifier yet.'}
								</p>
							</div>
							<Switch
								id="portfolio-published"
								checked={published}
								onCheckedChange={setPublished}
								disabled={!portfolio.publicCode}
							/>
						</div>
						<div className="flex items-center justify-between gap-3">
							<div>
								<Label htmlFor="portfolio-show-demo">Show demo link</Label>
								<p className="text-muted-foreground text-xs">
									Only the URL above will be exposed.
								</p>
							</div>
							<Switch
								id="portfolio-show-demo"
								checked={showDemo}
								onCheckedChange={setShowDemo}
							/>
						</div>
						<div className="flex items-center justify-between gap-3">
							<div>
								<Label htmlFor="portfolio-show-repository">
									Show repository link
								</Label>
								<p className="text-muted-foreground text-xs">
									{repositoryCanBeShown
										? 'Only linked public repositories can be shown.'
										: 'Link a public GitHub repository first.'}
								</p>
							</div>
							<Switch
								id="portfolio-show-repository"
								checked={showRepository}
								onCheckedChange={setShowRepository}
								disabled={!repositoryCanBeShown}
							/>
						</div>
						{published && portfolio.publicCode && (
							<a
								href={`/portfolio/${portfolio.publicCode}`}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
							>
								Preview public portfolio
								<ExternalLink className="h-3 w-3" />
							</a>
						)}
					</div>

					<div className="space-y-2">
						<Label>Relevant tasks</Label>
						<p className="text-muted-foreground text-xs">
							Choose the work that best demonstrates this project.
						</p>
						<div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
							{portfolio.tasks.length > 0 ? (
								portfolio.tasks.map((task) => (
									<label
										key={task.id}
										htmlFor={`portfolio-task-${task.id}`}
										className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
									>
										<Checkbox
											id={`portfolio-task-${task.id}`}
											checked={relevantTaskIds.includes(task.id)}
											onCheckedChange={() => toggleRelevantTask(task.id)}
										/>
										<span className="min-w-0 flex-1">
											<span className="block truncate">{task.title}</span>
											<span className="text-muted-foreground text-xs">
												{task.status === 'DONE' ? 'Complete' : 'In progress'}
											</span>
										</span>
									</label>
								))
							) : (
								<p className="p-2 text-muted-foreground text-xs">
									No tasks yet.
								</p>
							)}
						</div>
					</div>

					<Button
						type="button"
						size="sm"
						onClick={() =>
							updatePortfolio.mutate({
								projectId,
								summary: summary.trim() || null,
								demoUrl: demoUrl.trim() || null,
								published,
								showDemo,
								showRepository,
								relevantTaskIds
							})
						}
						disabled={updatePortfolio.isPending}
					>
						{updatePortfolio.isPending ? 'Saving…' : 'Save portfolio'}
					</Button>
				</>
			)}

			{portfolio.canEvaluate && (
				<div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
					<div className="flex items-center gap-2">
						<CheckCircle2 className="h-4 w-4 text-primary" />
						<Label htmlFor="portfolio-feedback">Mentor evaluation</Label>
					</div>
					<Textarea
						id="portfolio-feedback"
						value={feedback}
						onChange={(event) => setFeedback(event.target.value)}
						placeholder="Record the feedback that can be shown publicly."
						maxLength={5000}
						rows={4}
						className="resize-none bg-background"
					/>
					<div className="flex items-center justify-between gap-2">
						{portfolio.portfolioEvaluatedAt && (
							<Badge variant="secondary" className="gap-1">
								<Lock className="h-3 w-3" />
								Saved evaluation
							</Badge>
						)}
						<Button
							type="button"
							size="sm"
							onClick={() =>
								evaluatePortfolio.mutate({
									projectId,
									feedback: feedback.trim()
								})
							}
							disabled={evaluatePortfolio.isPending || !feedback.trim()}
						>
							{evaluatePortfolio.isPending ? 'Saving…' : 'Save evaluation'}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
