import type { Category, Prisma } from '@prisma/client';

export function createProjectData(
	input: Prisma.ProjectCreateInput,
	category: Category
): Prisma.ProjectCreateInput {
	return {
		...input,
		category: { connect: { id: category.id } },
		difficulty: input.difficulty
	};
}

export function getLastActivityRelativeTime(dateInput: string | null): string {
	if (!dateInput) {
		return 'No activity yet';
	}

	const date = new Date(dateInput);

	if (Number.isNaN(date.getTime())) {
		return 'No activity yet';
	}

	const now = new Date();
	const diffInMs = now.getTime() - date.getTime();
	const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
	const diffInDays = Math.floor(diffInHours / 24);

	if (diffInHours < 1) {
		return 'Just now';
	}
	if (diffInHours < 24) {
		return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
	}
	if (diffInDays < 7) {
		return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
	}
	return date.toLocaleDateString();
}
