import type { Project } from '../types';

export const mockProject: Project = {
	id: '1',
	title: 'Project Management System',
	description:
		'Building a project management system with Kanban and Scrum support',
	methodology: 'scrum',
	backlog: [
		{
			id: 'task1',
			title: 'Design Database Schema',
			description: 'Create the initial database schema for the project',
			priority: 'HIGH',
			status: 'TODO',
			tags: ['backend', 'database'],
			createdAt: new Date(),
			updatedAt: new Date(),
			sprintId: 1
		},
		{
			id: 'task2',
			title: 'Setup Authentication',
			description: 'Implement user authentication using NextAuth.js',
			priority: 'HIGH',
			status: 'TODO',
			tags: ['backend', 'auth'],
			createdAt: new Date(),
			updatedAt: new Date()
		}
	],
	columns: [
		{ id: 'todo', title: 'To Do', tasks: [] },
		{ id: 'in-progress', title: 'In Progress', tasks: [], limit: 3 },
		{ id: 'review', title: 'Review', tasks: [] },
		{ id: 'done', title: 'Done', tasks: [] }
	],
	sprints: [
		{
			id: 1,
			title: 'Sprint 1',
			goal: 'Basic project structure and authentication',
			startDate: new Date('2024-01-01'),
			endDate: new Date('2024-01-14'),
			status: 'active',
			tasks: []
		},
		{
			id: 2,
			title: 'Sprint 2',
			goal: 'Implement core project management features',
			startDate: new Date('2024-01-15'),
			endDate: new Date('2024-01-28'),
			status: 'planning',
			tasks: []
		}
	],
	scrumBoard: [
		{ id: 'sprint-todo', title: 'To Do', tasks: [] },
		{ id: 'sprint-progress', title: 'In Progress', tasks: [] },
		{ id: 'sprint-review', title: 'Review', tasks: [] },
		{ id: 'sprint-done', title: 'Done', tasks: [] }
	],
	epics: [
		{
			id: 'epic1',
			title: 'User Authentication',
			description: 'Implement complete user authentication system',
			status: 'active',
			createdAt: new Date(),
			tasks: [],
			progress: 0
		},
		{
			id: 'epic2',
			title: 'Project Management',
			description: 'Core project management features',
			status: 'active',
			createdAt: new Date(),
			tasks: [],
			progress: 0
		}
	]
};
