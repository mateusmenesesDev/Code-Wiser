'use client';

import { AlertTriangle, BarChart3, TrendingDown } from 'lucide-react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Progress } from '~/common/components/ui/progress';
import { api, type RouterOutputs } from '~/trpc/react';

type SprintMetrics = RouterOutputs['sprint']['getMetrics'];
type BurndownPoint = {
	date: string;
	idealRemaining: number;
	currentPoints: number;
	completedPoints: number;
	remainingPoints: number;
	scopeChangeCount: number;
};

interface SprintReportsProps {
	projectId: string;
	sprintId?: string;
}

const formatDate = (value: string) =>
	new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
		new Date(`${value}T00:00:00Z`)
	);

const Metric = ({
	label,
	value,
	detail,
	className
}: {
	label: string;
	value: string;
	detail?: string;
	className?: string;
}) => (
	<div className="rounded-lg border bg-card px-3 py-2.5">
		<p className="text-muted-foreground text-xs">{label}</p>
		<p className={`mt-1 font-semibold text-lg tabular-nums ${className ?? ''}`}>
			{value}
		</p>
		{detail && <p className="text-muted-foreground text-xs">{detail}</p>}
	</div>
);

const ChartLines = ({ points }: { points: BurndownPoint[] }) => {
	const maxValue = Math.max(
		1,
		...points.flatMap((point) => [point.idealRemaining, point.remainingPoints])
	);
	const x = (index: number) =>
		20 + (index / Math.max(1, points.length - 1)) * 560;
	const y = (value: number) => 180 - (value / maxValue) * 150;
	const ideal = points.map(
		(point, index) => `${x(index)},${y(point.idealRemaining)}`
	);
	const actual = points.map(
		(point, index) => `${x(index)},${y(point.remainingPoints)}`
	);

	return (
		<svg
			viewBox="0 0 600 220"
			role="img"
			aria-label="Sprint burndown showing ideal and actual remaining story points"
			className="h-52 w-full overflow-visible"
		>
			<line x1="20" y1="180" x2="580" y2="180" className="stroke-border" />
			<line x1="20" y1="30" x2="20" y2="180" className="stroke-border" />
			<polyline
				points={ideal.join(' ')}
				fill="none"
				className="stroke-muted-foreground"
				strokeDasharray="5 5"
				strokeWidth="2"
			/>
			<polyline
				points={actual.join(' ')}
				fill="none"
				className="stroke-info"
				strokeWidth="3"
			/>
			{points.map(
				(point, index) =>
					point.scopeChangeCount > 0 && (
						<circle
							key={point.date}
							cx={x(index)}
							cy={y(point.remainingPoints)}
							r={5}
							className="fill-warning stroke-background"
							strokeWidth="2"
							aria-label={`${point.scopeChangeCount} scope changes on ${formatDate(point.date)}`}
						/>
					)
			)}
			<text x="20" y="205" className="fill-muted-foreground text-[11px]">
				{formatDate(points[0]?.date ?? '')}
			</text>
			<text
				x="580"
				y="205"
				textAnchor="end"
				className="fill-muted-foreground text-[11px]"
			>
				{formatDate(points.at(-1)?.date ?? '')}
			</text>
		</svg>
	);
};

const BurndownCard = ({
	burndown
}: {
	burndown: SprintMetrics['burndown'] | undefined;
}) => {
	return (
		<Card>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between gap-3">
					<div>
						<CardTitle className="flex items-center gap-2 text-base" level={3}>
							<TrendingDown className="h-4 w-4 text-info" />
							Burndown
						</CardTitle>
						<CardDescription>
							Committed scope versus remaining points
						</CardDescription>
					</div>
					<Badge variant="outline" className="gap-1 text-xs">
						<span className="h-2 w-2 rounded-full bg-info" /> Actual
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				{burndown?.available && burndown.points.length > 0 ? (
					<>
						<ChartLines points={burndown.points} />
						<div className="flex items-center justify-between text-muted-foreground text-xs">
							<span>Dashed: ideal</span>
							<span>Dots: scope changes</span>
						</div>
						{burndown.truncated && (
							<p className="mt-2 flex items-center gap-1 text-warning-muted-foreground text-xs">
								<AlertTriangle className="h-3 w-3" />
								Only the first year of daily data is shown.
							</p>
						)}
					</>
				) : (
					<div className="flex h-52 items-center justify-center rounded-md border border-dashed px-4 text-center text-muted-foreground text-sm">
						{burndown
							? 'Start the Sprint to collect daily burndown data.'
							: 'Select a Sprint to view burndown data.'}
					</div>
				)}
			</CardContent>
		</Card>
	);
};

const VelocityCard = ({
	velocity,
	averageVelocity
}: {
	velocity: SprintMetrics['velocity'];
	averageVelocity: SprintMetrics['averageVelocity'];
}) => {
	const values = velocity.filter((item) => item.points !== null);
	const max = Math.max(1, ...values.map((item) => item.points ?? 0));
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-base" level={3}>
					<BarChart3 className="h-4 w-4 text-amber-500" />
					Project velocity
				</CardTitle>
				<CardDescription>
					Last {velocity.length} completed sprint
					{velocity.length === 1 ? '' : 's'}
					{averageVelocity !== null && ` · ${averageVelocity} pts average`}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{values.length > 0 ? (
					<div className="space-y-3">
						{velocity.map((item) => (
							<div key={item.id} className="flex items-center gap-3">
								<span
									className="w-28 truncate text-muted-foreground text-xs"
									title={item.title}
								>
									{item.title}
								</span>
								<div className="h-2 flex-1 rounded-full bg-muted">
									<div
										className="h-full rounded-full bg-amber-500"
										style={{ width: `${((item.points ?? 0) / max) * 100}%` }}
									/>
								</div>
								<span className="w-12 text-right font-medium text-xs tabular-nums">
									{item.points ?? '—'} pts
								</span>
							</div>
						))}
						{velocity.some((item) => !item.available) && (
							<p className="text-muted-foreground text-xs">
								Some older Sprints have insufficient history for velocity.
							</p>
						)}
					</div>
				) : (
					<div className="flex h-52 items-center justify-center rounded-md border border-dashed text-center text-muted-foreground text-sm">
						Complete Sprints to build a velocity history.
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default function SprintReports({
	projectId,
	sprintId
}: SprintReportsProps) {
	const {
		data: metrics,
		isError,
		isPending,
		refetch
	} = api.sprint.getMetrics.useQuery({
		projectId,
		sprintId
	});
	const summary = metrics?.summary;
	const progress =
		summary?.committedPoints !== null &&
		summary?.committedPoints !== undefined &&
		summary.committedPoints > 0
			? Math.min(100, (summary.completedPoints / summary.committedPoints) * 100)
			: 0;

	return (
		<div className="h-full overflow-y-auto bg-muted/20 p-4">
			<div className="mx-auto max-w-6xl space-y-4">
				<div>
					<h2 className="font-semibold text-lg">Reports</h2>
					<p className="text-muted-foreground text-sm">
						Track sprint progress and delivery trends.
					</p>
				</div>
				{isPending ? (
					<div className="rounded-lg border bg-card p-8 text-center text-muted-foreground text-sm">
						Loading reports...
					</div>
				) : isError ? (
					<div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-8 text-center">
						<p className="text-muted-foreground text-sm">
							Reports could not be loaded.
						</p>
						<Button variant="outline" size="sm" onClick={() => void refetch()}>
							Try again
						</Button>
					</div>
				) : (
					<>
						{summary && (
							<>
								<div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
									<Metric
										label="Committed"
										value={
											summary.committedPoints === null
												? '—'
												: `${summary.committedPoints} pts`
										}
										detail={
											summary.committedTaskCount === null
												? 'Not captured yet'
												: `${summary.committedTaskCount} tasks at start`
										}
									/>
									<Metric
										label="Current scope"
										value={`${summary.currentPoints} pts`}
										detail={`${summary.taskCount} tasks`}
									/>
									<Metric
										label="Completed"
										value={`${summary.completedPoints} pts`}
										detail={`${summary.doneCount} tasks`}
										className="text-success"
									/>
									<Metric
										label="Remaining"
										value={`${summary.remainingPoints} pts`}
										detail={
											summary.scopeChangeCount > 0
												? `${summary.scopeChangeCount} scope changes`
												: 'No scope changes'
										}
									/>
									<Metric
										label="Unestimated"
										value={String(summary.unestimatedTaskCount)}
										detail="Visible planning risk"
										className={
											summary.unestimatedTaskCount > 0
												? 'text-warning-muted-foreground'
												: ''
										}
									/>
								</div>
								{summary.committedPoints !== null &&
									summary.committedPoints > 0 && (
										<div className="flex items-center gap-3">
											<Progress value={progress} className="h-2 flex-1" />
											<span className="font-medium text-muted-foreground text-xs tabular-nums">
												{Math.round(progress)}% of commitment
											</span>
										</div>
									)}
							</>
						)}
						<div className="grid gap-3 lg:grid-cols-2">
							<BurndownCard burndown={metrics?.burndown} />
							<VelocityCard
								velocity={metrics?.velocity ?? []}
								averageVelocity={metrics?.averageVelocity ?? null}
							/>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
