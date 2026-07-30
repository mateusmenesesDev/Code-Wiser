import { ProjectAccessTypeEnum } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { isMentorshipLockedProject } from './projectStartAccess';

describe('isMentorshipLockedProject', () => {
	it('locks mentorship projects without active mentorship', () => {
		expect(
			isMentorshipLockedProject(ProjectAccessTypeEnum.MENTORSHIP, false)
		).toBe(true);
	});

	it('does not lock non-mentorship or active mentorship projects', () => {
		expect(
			isMentorshipLockedProject(ProjectAccessTypeEnum.MENTORSHIP, true)
		).toBe(false);
		expect(isMentorshipLockedProject(ProjectAccessTypeEnum.FREE, false)).toBe(
			false
		);
		expect(
			isMentorshipLockedProject(ProjectAccessTypeEnum.CREDITS, false)
		).toBe(false);
	});
});
