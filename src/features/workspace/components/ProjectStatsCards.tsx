import { CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { TaskStatusEnum } from '@prisma/client';

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

interface ProjectStatsCardsProps {
	tasks: {
		status: TaskStatusEnum;
	}[];
}

export function ProjectStatsCards({ tasks }: ProjectStatsCardsProps) {
	const totalTasks = tasks.length;
	const completedTasks = tasks.filter(
		(task) => task.status === TaskStatusEnum.DONE
	).length;
	const inProgressTasks = tasks.filter(
		(task) => task.status === TaskStatusEnum.IN_PROGRESS
	).length;
	const progressPercentage =
		totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

	return (
		<div className="ml-auto flex w-fit flex-wrap items-center justify-end gap-6 rounded-lg bg-card/30 px-3 py-1 text-sm 2xl:py-3">
			<StatItem
				icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
				value={progressPercentage}
				label="%"
			/>
			<StatItem
				icon={<CheckCircle className="h-4 w-4 text-green-600" />}
				value={completedTasks}
				label="done"
			/>
			<StatItem
				icon={<Clock className="h-4 w-4 text-orange-600" />}
				value={inProgressTasks}
				label="active"
			/>
			<StatItem
				icon={<Clock className="h-4 w-4 text-gray-600" />}
				value={totalTasks - completedTasks}
				label="left"
			/>
		</div>
	);
}
