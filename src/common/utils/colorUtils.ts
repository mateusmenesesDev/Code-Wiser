/**
 * Centralized color utility functions for consistent styling across the application
 */

const green =
	'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
const yellow =
	'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
const red =
	'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
const blue =
	'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
const purple =
	'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
const indigo =
	'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800';
const orange =
	'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
const gray =
	'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';

export const getDifficultyColor = (difficulty: string) => {
	switch (difficulty) {
		case 'BEGINNER':
			return green;
		case 'INTERMEDIATE':
			return yellow;
		case 'ADVANCED':
			return red;
		default:
			return gray;
	}
};

export const getCategoryColor = (category: string) => {
	switch (category) {
		case 'Web Development':
			return blue;
		case 'Mobile Development':
			return purple;
		case 'Data Science':
			return indigo;
		case 'DevOps':
			return orange;
		default:
			return gray;
	}
};

export const getAccessTypeColor = (
	accessType: 'FREE' | 'CREDITS' | 'MENTORSHIP'
) => {
	switch (accessType) {
		case 'FREE':
			return green;
		case 'CREDITS':
			return purple;
		case 'MENTORSHIP':
			return orange;
		default:
			return gray;
	}
};

// Template/Project status colors
export const getTemplateStatusColor = (status: string) => {
	switch (status) {
		case 'APPROVED':
			return green;
		case 'PENDING':
			return yellow;
		case 'REJECTED':
			return red;
		case 'REQUESTED_CHANGES':
			return orange;
		default:
			return gray;
	}
};

// Project progress status colors
export const getProjectStatusColor = (status: string) => {
	switch (status) {
		case 'In Progress':
			return blue;
		case 'Near Completion':
			return green;
		case 'Not Started':
			return gray;
		default:
			return gray;
	}
};

// Task status colors
export const getTaskStatusColor = (status: string) => {
	switch (status) {
		case 'TODO':
		case 'BACKLOG':
			return gray;
		case 'IN_PROGRESS':
		case 'READY_TO_DEVELOP':
			return blue;
		case 'IN_REVIEW':
		case 'CODE_REVIEW':
			return yellow;
		case 'DONE':
			return green;
		default:
			return gray;
	}
};

// Task priority colors
export const getTaskPriorityColor = (priority: string) => {
	switch (priority) {
		case 'HIGHEST':
			return red;
		case 'HIGH':
			return orange;
		case 'MEDIUM':
			return yellow;
		case 'LOW':
			return blue;
		case 'LOWEST':
			return green;
		default:
			return gray;
	}
};
