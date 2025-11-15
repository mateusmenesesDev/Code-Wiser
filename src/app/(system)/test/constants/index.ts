import { TaskStatusEnum } from "@prisma/client";

export const columns = [
	{
		id: TaskStatusEnum.BACKLOG,
		name: 'Backlog',
		color: '#64748B',
		bgColor: 'bg-slate-50 dark:bg-slate-900/20'
	},
	{
		id: TaskStatusEnum.READY_TO_DEVELOP,
		name: 'Ready to Develop',
		color: '#F59E0B',
		bgColor: 'bg-amber-50 dark:bg-amber-900/20'
	},
	{
		id: TaskStatusEnum.IN_PROGRESS,
		name: 'In Progress',
		color: '#3B82F6',
		bgColor: 'bg-blue-50 dark:bg-blue-900/20'
	},
	{
		id: TaskStatusEnum.CODE_REVIEW,
		name: 'Code Review',
		color: '#8B5CF6',
		bgColor: 'bg-violet-50 dark:bg-violet-900/20'
	},
	{
		id: TaskStatusEnum.TESTING,
		name: 'Testing',
		color: '#EC4899',
		bgColor: 'bg-pink-50 dark:bg-pink-900/20'
	},
	{
		id: TaskStatusEnum.DONE,
		name: 'Done',
		color: '#10B981',
		bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
	}
];