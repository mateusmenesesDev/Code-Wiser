import { TaskStatusEnum } from "@prisma/client";

export const columns = [
	{
		id: TaskStatusEnum.BACKLOG,
		name: 'Backlog',
		color: '#64748B',
	},
	{
		id: TaskStatusEnum.READY_TO_DEVELOP,
		name: 'Ready to Develop',
		color: '#F59E0B',
	},
	{
		id: TaskStatusEnum.IN_PROGRESS,
		name: 'In Progress',
		color: '#3B82F6',
	},
	{
		id: TaskStatusEnum.CODE_REVIEW,
		name: 'Code Review',
		color: '#8B5CF6',
	},
	{
		id: TaskStatusEnum.TESTING,
		name: 'Testing',
		color: '#EC4899',
	},
	{
		id: TaskStatusEnum.DONE,
		name: 'Done',
		color: '#10B981',
	}
];