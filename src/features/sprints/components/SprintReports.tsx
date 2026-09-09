'use client';

import { AlertTriangle, BarChart3, TrendingDown } from 'lucide-react';
import { type MouseEvent, useState } from 'react';
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
import { type RouterOutputs, api } from '~/trpc/react';

type SprintMetrics = RouterOutputs['sprint']['getMetrics'];
type BurndownPoint = {
	date: string;
	idealRemaining: number;
	currentPoints: number;
	completedPoints: number;
	remainingPoints: number | null;
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

const formatChartValue = (value: number | null) =>
	value === null
		? '—'
		: Number.isInteger(value)
			? String(value)
			: value.toFixed(1);

const ChartLines = ({ points }: { points: BurndownPoint[] }) => {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const plotLeft = 48;
	const plotRight = 580;
	const plotTop = 24;
	const plotBottom = 180;
	const maxValue = Math.max(
		1,
		...points.flatMap((point) =>
			point.remainingPoints === null
				? [point.idealRemaining]
				: [point.idealRemaining, point.remainingPoints]
		)
	);
	const x = (index: number) =>
		plotLeft +
		(index / Math.max(1, points.length - 1)) * (plotRight - plotLeft);
	const y = (value: number) =>
		plotBottom - (value / maxValue) * (plotBottom - plotTop);
	const ideal = points.map(
		(point, index) => `${x(index)},${y(point.idealRemaining)}`
	);
	const actual = points.flatMap((point, index) =>
		point.remainingPoints === null
			? []
			: [`${x(index)},${y(point.remainingPoints)}`]
	);
	const yTickValues = Array.from(
		{ length: 4 },
		(_, index) => (maxValue * (3 - index)) / 3
	);
	const xTickIndexes = Array.from(
		{ length: Math.min(6, points.length) },
		(_, index) =>
			Math.round(
				(index * Math.max(0, points.length - 1)) /
					Math.max(1, Math.min(5, points.length - 1))
			)
	);
	const handleMouseMove = (event: MouseEvent<SVGSVGElement>) => {
		const transform = event.currentTarget.getScreenCTM();
		if (!transform) return;
		const cursor = event.currentTarget.createSVGPoint();
		cursor.x = event.clientX;
		cursor.y = event.clientY;
		const { x: chartX, y: chartY } = cursor.matrixTransform(
			transform.inverse()
		);
		if (
			chartX < plotLeft ||
			chartX > plotRight ||
			chartY < plotTop ||
			chartY > plotBottom
		) {
			setHoveredIndex(null);
			return;
		}
		const index = Math.min(
			points.length - 1,
			Math.max(
				0,
				Math.round(
					((chartX - plotLeft) / (plotRight - plotLeft)) *
						Math.max(0, points.length - 1)
				)
			)
		);
		setHoveredIndex(index);
	};
	const hoveredPoint = hoveredIndex === null ? null : points[hoveredIndex];
	const tooltipWidth = 176;
	const tooltipX =
		hoveredIndex === null
			? 0
			: Math.min(
					Math.max(x(hoveredIndex) - tooltipWidth / 2, 4),
					600 - tooltipWidth - 4
				);
	const tooltipY = hoveredPoint
		? Math.max(
				4,
				Math.min(
					y(hoveredPoint.idealRemaining),
					hoveredPoint.remainingPoints === null
						? y(hoveredPoint.idealRemaining)
						: y(hoveredPoint.remainingPoints)
				) - 64
			)
		: 0;

	return (
		<svg
			viewBox="0 0 600 240"
			role="img"
			aria-label="Sprint burndown showing ideal and actual remaining story points"
			className="h-60 w-full overflow-visible"
			onMouseMove={handleMouseMove}
			onMouseLeave={() => setHoveredIndex(null)}
		>
			{yTickValues.map((value) => (
				<g key={value}>
					<line
						x1={plotLeft}
						y1={y(value)}
						x2={plotRight}
						y2={y(value)}
						className="stroke-border"
						strokeOpacity="0.65"
					/>
					<text
						x={plotLeft - 8}
						y={y(value) + 4}
						textAnchor="end"
						className="fill-muted-foreground text-[11px]"
					>
						{formatChartValue(value)}
					</text>
				</g>
			))}
			<line
				x1={plotLeft}
				y1={plotBottom}
				x2={plotRight}
				y2={plotBottom}
				className="stroke-border"
			/>
			<line
				x1={plotLeft}
				y1={plotTop}
				x2={plotLeft}
				y2={plotBottom}
				className="stroke-border"
			/>
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
			<rect
				x={plotLeft}
				y={plotTop}
				width={plotRight - plotLeft}
				height={plotBottom - plotTop}
				fill="transparent"
				pointerEvents="all"
			/>
			{points.map((point, index) => (
				<g
					key={point.date}
					tabIndex={0}
					aria-label={`${formatDate(point.date)}: ${point.remainingPoints === null ? 'remaining points not collected yet' : `${formatChartValue(point.remainingPoints)} remaining points`}, ${formatChartValue(point.idealRemaining)} ideal points`}
					onFocus={() => setHoveredIndex(index)}
					onBlur={() => setHoveredIndex(null)}
				>
					<title>
						{`${formatDate(point.date)} · ${point.remainingPoints === null ? 'remaining not collected' : `${formatChartValue(point.remainingPoints)} remaining`} · ${formatChartValue(point.idealRemaining)} ideal`}
					</title>
					{point.remainingPoints !== null && (
						<circle
							cx={x(index)}
							cy={y(point.remainingPoints)}
							r={3}
							className="fill-info stroke-background"
							strokeWidth="1"
						/>
					)}
					{point.scopeChangeCount > 0 && point.remainingPoints !== null && (
						<circle
							cx={x(index)}
							cy={y(point.remainingPoints)}
							r={5}
							className="fill-warning stroke-background"
							strokeWidth="2"
							aria-label={`${point.scopeChangeCount} scope changes on ${formatDate(point.date)}`}
						/>
					)}
				</g>
			))}
			{hoveredPoint && hoveredIndex !== null && (
				<g pointerEvents="none">
					<line
						x1={x(hoveredIndex)}
						y1={plotTop}
						x2={x(hoveredIndex)}
						y2={plotBottom}
						className="stroke-info"
						strokeDasharray="2 3"
						strokeOpacity="0.45"
					/>
					<rect
						x={tooltipX}
						y={tooltipY}
						width={tooltipWidth}
						height="58"
						rx="6"
						className="fill-popover stroke-border"
					/>
					<text
						x={tooltipX + 10}
						y={tooltipY + 17}
						className="fill-popover-foreground"
						fontSize="11"
						fontWeight="600"
					>
						{formatDate(hoveredPoint.date)}
					</text>
					<text
						x={tooltipX + 10}
						y={tooltipY + 34}
						className="fill-popover-foreground"
						fontSize="11"
					>
						{hoveredPoint.remainingPoints === null
							? 'Remaining: not collected'
							: `Remaining: ${formatChartValue(hoveredPoint.remainingPoints)} pts`}
					</text>
					<text
						x={tooltipX + 10}
						y={tooltipY + 49}
						className="fill-muted-foreground"
						fontSize="11"
					>
						{`Ideal: ${formatChartValue(hoveredPoint.idealRemaining)} pts`}
					</text>
				</g>
			)}
			{xTickIndexes.map((index) => (
				<g key={points[index]?.date ?? index}>
					<line
						x1={x(index)}
						y1={plotBottom}
						x2={x(index)}
						y2={plotBottom + 4}
						className="stroke-border"
					/>
					<text
						x={x(index)}
						y={plotBottom + 19}
						textAnchor="middle"
						className="fill-muted-foreground text-[11px]"
					>
						{formatDate(points[index]?.date ?? '')}
					</text>
				</g>
			))}
			<text
				x="14"
				y={(plotTop + plotBottom) / 2}
				textAnchor="middle"
				transform={`rotate(-90 14 ${(plotTop + plotBottom) / 2})`}
				className="fill-muted-foreground text-[11px]"
			>
				Story points
			</text>
			<text
				x={(plotLeft + plotRight) / 2}
				y="232"
				textAnchor="middle"
				className="fill-muted-foreground text-[11px]"
			>
				Date
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
						<div className="flex flex-wrap items-center justify-between gap-x-3 text-muted-foreground text-xs">
							<span>Solid: actual</span>
							<span>Dashed: ideal</span>
							<span>Dots: scope changes</span>
						</div>
						{burndown.points.some(
							({ remainingPoints }) => remainingPoints === null
						) && (
							<p className="mt-2 text-muted-foreground text-xs">
								Future dates show the planned ideal only.
							</p>
						)}
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
