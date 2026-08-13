import {
	Award,
	CheckCircle2,
	Circle,
	Code2,
	ExternalLink,
	Github,
	Milestone as MilestoneIcon
} from 'lucide-react';
import { Badge } from '~/common/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Progress } from '~/common/components/ui/progress';
import type { getPublicPortfolioByCode } from '~/server/services/portfolio';

type PublicPortfolio = NonNullable<
	Awaited<ReturnType<typeof getPublicPortfolioByCode>>
>;

const criterionLabels = {
	hasTasks: 'Project work exists',
	allTasksDone: 'All project tasks are complete',
	milestonesReviewed: 'Milestones were reviewed by a mentor',
	reviewsResolved: 'Pull request reviews are resolved',
	mentorEvaluation: 'Mentor evaluation is recorded'
} as const;

function PortfolioTask({
	title,
	publicNumber,
	status
}: PublicPortfolio['relevantTasks'][number]) {
	return (
		<li className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
			{status === 'DONE' ? (
				<CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
			) : (
				<Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
			)}
			<span className="min-w-0 flex-1 truncate">{title}</span>
			{publicNumber !== null && (
				<span className="text-muted-foreground text-xs">#{publicNumber}</span>
			)}
		</li>
	);
}

export default function PublicPortfolioPage({
	portfolio
}: {
	portfolio: PublicPortfolio;
}) {
	const { completion } = portfolio;
	return (
		<main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
			<header className="space-y-4">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="secondary">{portfolio.category}</Badge>
					{completion.isComplete && (
						<Badge variant="success" className="gap-1">
							<Award className="h-3.5 w-3.5" />
							Completed project
						</Badge>
					)}
				</div>
				<h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
					{portfolio.title}
				</h1>
				<p className="max-w-3xl text-lg text-muted-foreground leading-relaxed">
					{portfolio.summary}
				</p>
				<div className="flex flex-wrap gap-3">
					{portfolio.demoUrl && (
						<a
							href={portfolio.demoUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm hover:bg-primary/90"
						>
							<ExternalLink className="h-4 w-4" />
							View demo
						</a>
					)}
					{portfolio.repositoryUrl && (
						<a
							href={portfolio.repositoryUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 rounded-md border px-4 py-2 font-medium text-sm hover:bg-muted"
						>
							<Github className="h-4 w-4" />
							View repository
						</a>
					)}
				</div>
			</header>

			<section className="grid gap-6 lg:grid-cols-[1fr_280px]">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Code2 className="h-5 w-5 text-primary" />
							Technologies
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-2">
						{portfolio.technologies.length > 0 ? (
							portfolio.technologies.map((technology) => (
								<Badge key={technology.id} variant="outline">
									{technology.name}
								</Badge>
							))
						) : (
							<p className="text-muted-foreground text-sm">
								No technology stack was published.
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Completion</CardTitle>
						<CardDescription>
							{completion.completedCriteria} of {completion.totalCriteria}{' '}
							criteria met
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Progress
							value={
								(completion.completedCriteria / completion.totalCriteria) * 100
							}
							className="h-2"
						/>
						<ul className="space-y-2 text-sm">
							{completion.criteria.map((criterion) => (
								<li key={criterion.key} className="flex items-start gap-2">
									{criterion.complete ? (
										<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
									) : (
										<Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
									)}
									<span
										className={
											criterion.complete ? '' : 'text-muted-foreground'
										}
									>
										{criterionLabels[criterion.key]}
									</span>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</section>

			<section className="space-y-6">
				<div>
					<h2 className="flex items-center gap-2 font-semibold text-2xl">
						<MilestoneIcon className="h-5 w-5 text-primary" />
						Milestones
					</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						The project roadmap and the work selected as evidence.
					</p>
				</div>
				{portfolio.milestones.length > 0 ? (
					<div className="grid gap-4 md:grid-cols-2">
						{portfolio.milestones.map((milestone) => (
							<Card key={milestone.id}>
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between gap-3">
										<div>
											<CardTitle className="text-lg">
												{milestone.title}
											</CardTitle>
											{milestone.description && (
												<CardDescription className="mt-1">
													{milestone.description}
												</CardDescription>
											)}
										</div>
										<Badge
											variant={milestone.reviewedAt ? 'success' : 'outline'}
										>
											{milestone.reviewedAt ? 'Reviewed' : 'In progress'}
										</Badge>
									</div>
								</CardHeader>
								<CardContent>
									{milestone.tasks.length > 0 ? (
										<ul className="space-y-2">
											{milestone.tasks.map((task) => (
												<PortfolioTask key={task.id} {...task} />
											))}
										</ul>
									) : (
										<p className="text-muted-foreground text-sm">
											No selected tasks for this milestone.
										</p>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<Card>
						<CardContent className="p-6 text-muted-foreground text-sm">
							No milestones were published for this project.
						</CardContent>
					</Card>
				)}
			</section>

			{portfolio.relevantTasks.some(
				(task) =>
					!portfolio.milestones.some((milestone) =>
						milestone.tasks.some(({ id }) => id === task.id)
					)
			) && (
				<section className="space-y-3">
					<h2 className="font-semibold text-2xl">Selected work</h2>
					<ul className="grid gap-2 md:grid-cols-2">
						{portfolio.relevantTasks
							.filter(
								(task) =>
									!portfolio.milestones.some((milestone) =>
										milestone.tasks.some(({ id }) => id === task.id)
									)
							)
							.map((task) => (
								<PortfolioTask key={task.id} {...task} />
							))}
					</ul>
				</section>
			)}

			{portfolio.mentorFeedback && (
				<Card className="border-primary/30 bg-primary/5">
					<CardHeader>
						<CardTitle>Mentor feedback</CardTitle>
						<CardDescription>
							{portfolio.mentorName
								? `Reviewed by ${portfolio.mentorName}`
								: 'Feedback from the project review'}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="whitespace-pre-wrap text-sm leading-relaxed">
							{portfolio.mentorFeedback}
						</p>
					</CardContent>
				</Card>
			)}

			<footer className="border-t pt-4 text-muted-foreground text-xs">
				Published project portfolio
			</footer>
		</main>
	);
}
