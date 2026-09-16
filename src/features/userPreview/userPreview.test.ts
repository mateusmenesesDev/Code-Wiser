import { describe, expect, it } from 'vitest';
import {
	USER_PREVIEW_PROFILES,
	getUserPreviewProfile,
	isUserPreviewMode,
	isUserViewMode
} from './userPreview';

describe('user preview profiles', () => {
	it('provides a credit-based student view and an active mentor view', () => {
		expect(getUserPreviewProfile('student')).toEqual({
			credits: 500,
			hasMentorship: false
		});
		expect(getUserPreviewProfile('mentor')).toEqual({
			credits: null,
			hasMentorship: true
		});
	});

	it('accepts only supported preview modes from storage', () => {
		expect(isUserPreviewMode('student')).toBe(true);
		expect(isUserPreviewMode('mentor')).toBe(true);
		expect(isUserPreviewMode('admin')).toBe(false);
		expect(isUserPreviewMode(null)).toBe(false);
		expect(Object.keys(USER_PREVIEW_PROFILES)).toEqual(['mentor', 'student']);
		expect(isUserViewMode('admin')).toBe(true);
		expect(isUserViewMode('student')).toBe(true);
		expect(isUserViewMode('unknown')).toBe(false);
	});
});
