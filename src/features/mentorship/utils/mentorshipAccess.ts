/**
 * Check if user has mentorship access
 */
export function hasMentorshipAccess(mentorshipStatus: string | null): boolean {
	return mentorshipStatus === 'ACTIVE';
}

/**
 * Format date for display
 */
export function formatSessionDate(date: Date): string {
	return new Intl.DateTimeFormat('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	}).format(new Date(date));
}

/**
 * Format time for display
 */
export function formatSessionTime(date: Date): string {
	return new Intl.DateTimeFormat('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	}).format(new Date(date));
}

/**
 * Format date and time together
 */
export function formatSessionDateTime(date: Date): string {
	return `${formatSessionDate(date)} at ${formatSessionTime(date)}`;
}
