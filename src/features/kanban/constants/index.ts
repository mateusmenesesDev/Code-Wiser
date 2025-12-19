import { TaskStatusEnum } from '@prisma/client';

export const columns = [
	{
		id: TaskStatusEnum.BACKLOG,
		name: 'Backlog',
		color: 'var(--status-backlog)'
	},
	{
		id: TaskStatusEnum.READY_TO_DEVELOP,
		name: 'Ready to Develop',
		color: 'var(--status-ready)'
	},
	{
		id: TaskStatusEnum.IN_PROGRESS,
		name: 'In Progress',
		color: 'var(--status-in-progress)'
	},
	{
		id: TaskStatusEnum.CODE_REVIEW,
		name: 'Code Review',
		color: 'var(--status-review)'
	},
	{
		id: TaskStatusEnum.TESTING,
		name: 'Testing',
		color: 'var(--status-testing)'
	},
	{
		id: TaskStatusEnum.DONE,
		name: 'Done',
		color: 'var(--status-done)'
	}
];
