import type { ProjectTemplate, User } from '@prisma/client';

export const userHasAccess = (user: User, projectTemplate: ProjectTemplate) => {
	if (user.mentorshipStatus === 'ACTIVE') return true;

	if (projectTemplate.accessType === 'FREE') {
		return true;
	}

	if (projectTemplate.accessType === 'CREDITS') {
		return user.credits >= (projectTemplate.credits ?? 0);
	}

	return false;
};
