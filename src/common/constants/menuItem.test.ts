import { describe, expect, it } from 'vitest';
import { WORK_NAV_ITEMS, isNavigationItemVisible } from './menuItem';

const visibility = {
	isSignedIn: true,
	hasMentorship: false,
	hasAdminRole: () => false,
	hasPermission: (permission: ClerkAuthorization['permission']) =>
		permission === 'org:project:create'
};

describe('navigation item visibility', () => {
	const dashboard = WORK_NAV_ITEMS.find((item) => item.href === '/');
	const exercises = WORK_NAV_ITEMS.find((item) => item.href === '/exercises');
	const myProjects = WORK_NAV_ITEMS.find(
		(item) => item.href === '/my-projects'
	);
	const mentorship = WORK_NAV_ITEMS.find((item) => item.href === '/mentorship');

	if (!dashboard || !exercises || !myProjects || !mentorship) {
		throw new Error('Expected work navigation items are missing');
	}

	it('keeps public and signed-in work destinations visible', () => {
		expect(isNavigationItemVisible(exercises, visibility)).toBe(true);
		expect(isNavigationItemVisible(dashboard, visibility)).toBe(true);
		expect(isNavigationItemVisible(myProjects, visibility)).toBe(true);
	});

	it('hides mentorship without an active mentorship', () => {
		expect(isNavigationItemVisible(mentorship, visibility)).toBe(false);
	});

	it('shows admin destinations for users with the admin role', () => {
		const adminDestination = {
			...dashboard,
			permission: 'org:project:create' as const
		};

		expect(
			isNavigationItemVisible(adminDestination, {
				...visibility,
				hasAdminRole: () => true,
				hasPermission: () => false
			})
		).toBe(true);
	});

	it('hides signed-in destinations for visitors', () => {
		expect(
			isNavigationItemVisible(dashboard, {
				...visibility,
				isSignedIn: false
			})
		).toBe(false);
	});
});
