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
		<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<Card className="border-0 bg-card/50 shadow-lg backdrop-blur-sm">
				<CardHeader className="pb-3">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						Overall Progress
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3">
						<TrendingUp className="h-8 w-8 text-blue-600" />
						<div>
							<p className="font-bold text-2xl">{stats.progressPercentage}%</p>
							<Progress
								value={stats.progressPercentage}
								className="mt-1 h-2 w-20"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border-0 bg-card/50 shadow-lg backdrop-blur-sm">
				<CardHeader className="pb-3">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						Tasks Completed
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3">
						<CheckCircle className="h-8 w-8 text-green-600" />
						<div>
							<p className="font-bold text-2xl">
								{stats.completedTasks}/{stats.totalTasks}
							</p>
							<p className="text-muted-foreground text-xs">Total tasks</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border-0 bg-card/50 shadow-lg backdrop-blur-sm">
				<CardHeader className="pb-3">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						In Progress
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3">
						<Target className="h-8 w-8 text-purple-600" />
						<div>
							<p className="font-bold text-2xl">{stats.inProgressTasks}</p>
							<p className="text-muted-foreground text-xs">Active tasks</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border-0 bg-card/50 shadow-lg backdrop-blur-sm">
				<CardHeader className="pb-3">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						Remaining Tasks
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3">
						<Clock className="h-8 w-8 text-orange-600" />
						<div>
							<p className="font-bold text-2xl">
								{stats.totalTasks - stats.completedTasks}
							</p>
							<p className="text-muted-foreground text-xs">Tasks left</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
