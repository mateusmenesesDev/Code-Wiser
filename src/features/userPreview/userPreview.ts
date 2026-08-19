export const USER_PREVIEW_STORAGE_KEY = 'codewise-user-preview';

export const USER_PREVIEW_PROFILES = {
	free: {
		credits: 500,
		hasMentorship: false
	},
	mentorship: {
		credits: 0,
		hasMentorship: true
	}
} as const;

export type UserPreviewMode = keyof typeof USER_PREVIEW_PROFILES;

export function getUserPreviewProfile(mode: UserPreviewMode) {
	return USER_PREVIEW_PROFILES[mode];
}

export function isUserPreviewMode(
	value: string | null
): value is UserPreviewMode {
	return value === 'free' || value === 'mentorship';
}
