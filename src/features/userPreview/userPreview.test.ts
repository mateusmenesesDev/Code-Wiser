import { describe, expect, it } from 'vitest';
import {
	getUserPreviewProfile,
	isUserPreviewMode,
	USER_PREVIEW_PROFILES
} from './userPreview';

describe('user preview profiles', () => {
	it('provides credits for the free learner and active mentorship access for the mentorship learner', () => {
		expect(getUserPreviewProfile('free')).toEqual({
			credits: 500,
			hasMentorship: false
		});
		expect(getUserPreviewProfile('mentorship')).toEqual({
			credits: 0,
			hasMentorship: true
		});
	});

	it('accepts only supported preview modes from storage', () => {
		expect(isUserPreviewMode('free')).toBe(true);
		expect(isUserPreviewMode('mentorship')).toBe(true);
		expect(isUserPreviewMode('admin')).toBe(false);
		expect(isUserPreviewMode(null)).toBe(false);
		expect(Object.keys(USER_PREVIEW_PROFILES)).toEqual(['free', 'mentorship']);
	});
});
