export const USER_PREVIEW_STORAGE_KEY = 'codewise-user-preview';

export const USER_PREVIEW_PROFILES = {
	mentor: {
		credits: null,
		hasMentorship: true
	},
	student: {
		credits: 500,
		hasMentorship: false
	}
} as const;

export type UserPreviewMode = keyof typeof USER_PREVIEW_PROFILES;
export type UserViewMode = 'admin' | UserPreviewMode;

export function getUserPreviewProfile(mode: UserPreviewMode) {
	return USER_PREVIEW_PROFILES[mode];
}

export function isUserPreviewMode(
	value: string | null
): value is UserPreviewMode {
	return value === 'mentor' || value === 'student';
}

export function isUserViewMode(value: string | null): value is UserViewMode {
	return value === 'admin' || isUserPreviewMode(value);
}
