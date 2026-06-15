import { describe, expect, it } from 'vitest';
import { onboardingTours } from './onboardingTours';

const selectors = (flow: keyof typeof onboardingTours) =>
	onboardingTours[flow].map((step) => step.element);

describe('onboardingTours', () => {
	it('keeps the normal tour scoped to catalog, credits, and My Projects', () => {
		expect(selectors('normal')).toEqual([
			'[data-onboarding="project-catalog"]',
			'[data-onboarding="user-credits"]',
			'[data-onboarding="my-projects-access"]'
		]);
	});

	it('keeps the mentorship tour scoped to the mentorship page', () => {
		expect(selectors('mentorship')).toEqual([
			'[data-onboarding="mentorship-dashboard"]',
			'[data-onboarding="mentorship-bookings"]',
			'[data-onboarding="mentorship-sessions"]'
		]);
	});
});
