import { describe, expect, it } from 'vitest';
import {
	isNavigationItemVisible,
	WORK_NAV_ITEMS
} from './menuItem';

const visibility = {
	isSignedIn: true,
	hasMentorship: false,
	hasPermission: (permission: ClerkAuthorization['permission']) =>
		permission === 'org:project:create'
};

describe('navigation item visibility', () => {
	it('keeps public and signed-in work destinations visible', () => {
		expect(isNavigationItemVisible(WORK_NAV_ITEMS[0], visibility)).toBe(true);
		expect(isNavigationItemVisible(WORK_NAV_ITEMS[1], visibility)).toBe(true);
	});

	it('hides mentorship without an active mentorship', () => {
		expect(isNavigationItemVisible(WORK_NAV_ITEMS[2], visibility)).toBe(false);
	});

	it('hides signed-in destinations for visitors', () => {
		expect(
			isNavigationItemVisible(WORK_NAV_ITEMS[1], {
				...visibility,
				isSignedIn: false
			})
		).toBe(false);
	});
});
