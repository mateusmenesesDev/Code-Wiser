import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { createCallerFactory, createTRPCContext } from '~/server/api/trpc';
import { onboardingRouter } from './onboarding.router';

const authState = vi.hoisted(() => ({
	userId: 'user-1' as string | null,
	isAdmin: false
}));

vi.mock('@clerk/nextjs/server', () => ({
	auth: () => ({
		userId: authState.userId,
		sessionClaims: authState.isAdmin ? { o: { rol: 'admin' } } : null,
		sessionId: authState.userId ? 'test-session-id' : null,
		getToken: () => Promise.resolve(authState.userId ? 'test-token' : null),
		has: ({ role }: { role: string }) =>
			authState.isAdmin && role === 'org:admin'
	})
}));

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/server/realtime', () => ({
	getRealtimeService: () => ({})
}));

describe('onboarding diagnosis', () => {
	const createCaller = createCallerFactory(onboardingRouter);

	beforeEach(() => {
		authState.userId = 'user-1';
		authState.isAdmin = false;
	});

	it('returns the current diagnosis status and answers', async () => {
		const completedAt = new Date('2026-08-22T12:00:00.000Z');
		mockDb.user.findUnique.mockResolvedValue({
			mentorshipStatus: 'INACTIVE',
			normalOnboardingCompletedAt: null,
			mentorshipOnboardingCompletedAt: null,
			diagnosisCompletedAt: completedAt,
			learningGoal: 'GET_FIRST_JOB',
			selfReportedLevel: 'BEGINNER',
			interestedTechnologies: ['JAVASCRIPT'],
			weeklyAvailabilityBand: 'FROM_4_TO_7',
			priorExperience: 'Some projects'
		} as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(caller.getStatus()).resolves.toEqual({
			diagnosisCompletedAt: completedAt,
			learningGoal: 'GET_FIRST_JOB',
			selfReportedLevel: 'BEGINNER',
			interestedTechnologies: ['JAVASCRIPT'],
			weeklyAvailabilityBand: 'FROM_4_TO_7',
			priorExperience: 'Some projects',
			mentorshipStatus: 'INACTIVE',
			normalOnboardingCompletedAt: null,
			mentorshipOnboardingCompletedAt: null
		});
	});

	it('saves the diagnosis for the authenticated user', async () => {
		const completedAt = new Date('2026-08-22T12:00:00.000Z');
		mockDb.user.update.mockResolvedValue({
			diagnosisCompletedAt: completedAt,
			learningGoal: 'CHANGE_SPECIALTY',
			selfReportedLevel: 'INTERMEDIATE',
			interestedTechnologies: ['TYPESCRIPT', 'REACT'],
			weeklyAvailabilityBand: 'FROM_8_TO_12',
			priorExperience: ''
		} as never);

		const caller = createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await caller.saveDiagnosis({
			learningGoal: 'CHANGE_SPECIALTY',
			selfReportedLevel: 'INTERMEDIATE',
			interestedTechnologies: ['TYPESCRIPT', 'REACT'],
			weeklyAvailabilityBand: 'FROM_8_TO_12',
			priorExperience: ''
		});

		expect(mockDb.user.update).toHaveBeenCalledWith({
			where: { id: 'user-1' },
			data: {
				learningGoal: 'CHANGE_SPECIALTY',
				selfReportedLevel: 'INTERMEDIATE',
				interestedTechnologies: ['TYPESCRIPT', 'REACT'],
				weeklyAvailabilityBand: 'FROM_8_TO_12',
				priorExperience: '',
				diagnosisCompletedAt: expect.any(Date)
			},
			select: expect.any(Object)
		});
	});
});
