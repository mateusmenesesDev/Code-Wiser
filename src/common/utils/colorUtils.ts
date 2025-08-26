/**
 * Centralized color utility functions for consistent styling across the application
 */

import type {
	ProjectAccessTypeEnum,
	ProjectDifficultyEnum,
	ProjectStatusEnum,
	TaskPriorityEnum
} from '@prisma/client';

const green =
	'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
const yellow =
	'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
const blue =
	'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
const gray =
	'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';

export const getDifficultyBadgeColor = (
	difficulty: ProjectDifficultyEnum
): 'success' | 'warning' | 'destructive' | 'outline' => {
	switch (difficulty) {
		case 'BEGINNER':
			return 'success';
		case 'INTERMEDIATE':
			return 'warning';
		case 'ADVANCED':
			return 'destructive';
		default:
			return 'outline';
	}
};

export const getBadgeAccessTypeColor = (accessType: ProjectAccessTypeEnum) => {
	switch (accessType) {
		case 'FREE':
			return 'secondary';
		case 'CREDITS':
			return 'purple-solid';
		case 'MENTORSHIP':
			return 'purple-solid';
	}
};

// Template/Project status colors
export const getBadgeTemplateStatusColor = (status: ProjectStatusEnum) => {
	switch (status) {
		case 'APPROVED':
			return 'success';
		case 'PENDING':
			return 'warning';
		case 'REJECTED':
			return 'destructive';
		case 'REQUESTED_CHANGES':
			return 'warning';
		default:
			return 'outline';
	}
};

// Project progress status colors
export const getBadgeProjectStatusColor = (status: ProjectStatusEnum) => {
	switch (status) {
		case 'PENDING':
			return 'outline';
		case 'APPROVED':
			return 'success';
		case 'REJECTED':
			return 'destructive';
		default:
			return 'outline';
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
export const getBadgeTaskPriorityColor = (priority: TaskPriorityEnum) => {
	switch (priority) {
		case 'HIGHEST':
			return 'destructive';
		case 'HIGH':
			return 'warning';
		case 'MEDIUM':
			return 'secondary';
		default:
			return 'outline';
	}
};
