import { CheckCircle, Clock, TrendingUp } from 'lucide-react';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Progress } from '~/common/components/ui/progress';

type StatCardProps = {
	title: string;
	icon: React.ReactNode;
	value: number;
	percentage: number;
};

export default function StatCard({
	title,
	icon,
	value,
	percentage
}: StatCardProps) {
	return (
		<Card className="border-0 bg-card/50 px-4 shadow-lg backdrop-blur-sm">
			<CardHeader className="px-0 pt-4">
				<CardTitle className="font-medium text-muted-foreground text-sm">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="px-0 pb-4">
				<div className="flex items-center gap-2">
					{icon}
					<div>
						<p className="font-bold text-xl">{value}%</p>
						<Progress value={percentage} className="mt-1 h-1.5 w-16" />
					</div>
				</div>
			</CardContent>
		</Card>
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
		<div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
			<StatCard
				title="Overall Progress"
				icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
				value={stats.progressPercentage}
				percentage={stats.progressPercentage}
			/>

			<StatCard
				title="Tasks Completed"
				icon={<CheckCircle className="h-6 w-6 text-green-600" />}
				value={stats.completedTasks}
				percentage={stats.progressPercentage}
			/>

			<StatCard
				title="In Progress Tasks"
				icon={<Clock className="h-6 w-6 text-orange-600" />}
				value={stats.inProgressTasks}
				percentage={stats.progressPercentage}
			/>

			<StatCard
				title="Remaining Tasks"
				icon={<Clock className="h-6 w-6 text-orange-600" />}
				value={stats.totalTasks - stats.completedTasks}
				percentage={stats.progressPercentage}
			/>
		</div>
	);
}
