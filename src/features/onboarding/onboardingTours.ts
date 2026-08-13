import type { DriveStep } from 'driver.js';

export type OnboardingFlow = 'normal' | 'mentorship';

export const onboardingTours: Record<OnboardingFlow, DriveStep[]> = {
	normal: [
		{
			element: '[data-onboarding="project-catalog"]',
			popover: {
				title: 'Browse the project catalog',
				description:
					'Find a project that matches your level and goals. Use filters to narrow the catalog before starting.'
			}
		},
		{
			element: '[data-onboarding="user-credits"]',
			popover: {
				title: 'Track your credits',
				description:
					'Credits unlock paid projects. Your current balance is always visible in the header when you are not on an active mentorship plan.'
			}
		},
		{
			element: '[data-onboarding="my-projects-access"]',
			popover: {
				title: 'Open My Projects',
				description:
					'After joining a project, use the Work section in the sidebar to continue from My Projects.'
			}
		}
	],
	mentorship: [
		{
			element: '[data-onboarding="mentorship-dashboard"]',
			popover: {
				title: 'Manage your mentorship week',
				description:
					'See how many sessions you have left this week and when your weekly allowance resets.'
			}
		},
		{
			element: '[data-onboarding="mentorship-bookings"]',
			popover: {
				title: 'Review upcoming sessions',
				description:
					'Your scheduled mentorship calls appear here. You can reschedule or cancel when needed.'
			}
		},
		{
			element: '[data-onboarding="mentorship-sessions"]',
			popover: {
				title: 'Book a mentorship session',
				description:
					'Pick an available slot on the calendar to schedule your next one-on-one session.'
			}
		}
	]
};

export function getLocalizedOnboardingTours(
	t: (key: string) => string
): Record<OnboardingFlow, DriveStep[]> {
	return {
		normal: [
			{
				element: '[data-onboarding="project-catalog"]',
				popover: {
					title: t('browseCatalogTitle'),
					description: t('browseCatalogDescription')
				}
			},
			{
				element: '[data-onboarding="user-credits"]',
				popover: {
					title: t('trackCreditsTitle'),
					description: t('trackCreditsDescription')
				}
			},
			{
				element: '[data-onboarding="my-projects-access"]',
				popover: {
					title: t('openProjectsTitle'),
					description: t('openProjectsDescription')
				}
			}
		],
		mentorship: [
			{
				element: '[data-onboarding="mentorship-dashboard"]',
				popover: {
					title: t('manageMentorshipTitle'),
					description: t('manageMentorshipDescription')
				}
			},
			{
				element: '[data-onboarding="mentorship-bookings"]',
				popover: {
					title: t('upcomingSessionsTitle'),
					description: t('upcomingSessionsDescription')
				}
			},
			{
				element: '[data-onboarding="mentorship-sessions"]',
				popover: {
					title: t('bookSessionTitle'),
					description: t('bookSessionDescription')
				}
			}
		]
	};
}

export function getPresentOnboardingSteps(
	flow: OnboardingFlow,
	tours: Record<OnboardingFlow, DriveStep[]> = onboardingTours
) {
	return tours[flow].filter((step) => {
		if (typeof step.element !== 'string') {
			return true;
		}

		const element = document.querySelector(step.element);
		return element && element.getClientRects().length > 0;
	});
}
