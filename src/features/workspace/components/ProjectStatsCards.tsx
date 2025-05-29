import { Progress } from '@radix-ui/react-progress';
import { CheckCircle, Clock, Target, TrendingUp } from 'lucide-react';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';

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
		<section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Total Tasks</CardTitle>
					<Target className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{stats.totalTasks}</div>
					<p className="text-muted-foreground text-xs">+2 from last week</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Completed</CardTitle>
					<CheckCircle className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{stats.completedTasks}</div>
					<p className="text-muted-foreground text-xs">
						{Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
						completion
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">In Progress</CardTitle>
					<Clock className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{stats.inProgressTasks}</div>
					<p className="text-muted-foreground text-xs">+4 from yesterday</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Progress</CardTitle>
					<TrendingUp className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{stats.progressPercentage}%</div>
					<Progress value={stats.progressPercentage} className="mt-2" />
				</CardContent>
			</Card>
		</section>
	);
}
