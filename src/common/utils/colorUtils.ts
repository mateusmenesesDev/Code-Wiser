/**
 * Centralized color utility functions for consistent styling across the application
 */

import type {
	ProjectAccessTypeEnum,
	ProjectDifficultyEnum,
	ProjectStatusEnum,
	TaskPriorityEnum
} from '@prisma/client';

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
			return 'bg-status-backlog-muted text-status-backlog-muted-foreground border-status-backlog-border';
		case 'IN_PROGRESS':
			return 'bg-status-in-progress-muted text-status-in-progress-muted-foreground border-status-in-progress-border';
		case 'READY_TO_DEVELOP':
			return 'bg-status-ready-muted text-status-ready-muted-foreground border-status-ready-border';
		case 'IN_REVIEW':
		case 'CODE_REVIEW':
			return 'bg-status-review-muted text-status-review-muted-foreground border-status-review-border';
		case 'DONE':
			return 'bg-status-done-muted text-status-done-muted-foreground border-status-done-border';
		default:
			return 'bg-status-backlog-muted text-status-backlog-muted-foreground border-status-backlog-border';
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
