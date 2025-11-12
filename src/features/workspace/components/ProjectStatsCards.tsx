import { CheckCircle, Clock, TrendingUp } from 'lucide-react';

type StatItemProps = {
	icon: React.ReactNode;
	value: number;
	label: string;
};

function StatItem({ icon, value, label }: StatItemProps) {
	return (
		<div className="flex items-center gap-2">
			{icon}
			<span className="font-medium">{value}</span>
			<span className="text-muted-foreground text-sm">{label}</span>
		</div>
	);
}

interface ProjectStats {
	totalTasks: number;
	completedTasks: number;
	inProgressTasks: number;
	progressPercentage: number;
}

interface ProjectStatsCardsProps {
	stats: ProjectStats;
}

export function ProjectStatsCards({ stats }: ProjectStatsCardsProps) {
	return (
		<div className="ml-auto flex w-fit flex-wrap items-center justify-end gap-6 rounded-lg bg-card/30 px-3 py-1 text-sm 2xl:py-3">
			<StatItem
				icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
				value={stats.progressPercentage}
				label="%"
			/>
			<StatItem
				icon={<CheckCircle className="h-4 w-4 text-green-600" />}
				value={stats.completedTasks}
				label="done"
			/>
			<StatItem
				icon={<Clock className="h-4 w-4 text-orange-600" />}
				value={stats.inProgressTasks}
				label="active"
			/>
			<StatItem
				icon={<Clock className="h-4 w-4 text-gray-600" />}
				value={stats.totalTasks - stats.completedTasks}
				label="left"
			/>
		</div>
	);
}
