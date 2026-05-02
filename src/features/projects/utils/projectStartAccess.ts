import { ProjectAccessTypeEnum } from '@prisma/client';

export function isMentorshipLockedProject(
	accessType: ProjectAccessTypeEnum,
	userHasMentorship: boolean
) {
	return accessType === ProjectAccessTypeEnum.MENTORSHIP && !userHasMentorship;
}
