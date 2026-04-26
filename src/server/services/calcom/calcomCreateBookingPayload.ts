/** Cal.com v2 docs: create/cancel/reschedule booking require this header value. */
export const CALCOM_API_VERSION = '2026-02-25';

export function normalizeIanaTimeZoneForCalcom(input: string): string {
	const trimmed = input.trim();
	if (trimmed.length === 0) return 'UTC';
	try {
		Intl.DateTimeFormat('en-US', { timeZone: trimmed }).format(new Date(0));
		return trimmed;
	} catch {
		return 'UTC';
	}
}

export type CalcomCreateBookingAttendeeInput = {
	name: string;
	email: string;
	timeZone: string;
	language?: string;
};

export function buildCalcomCreateBookingBody(params: {
	eventTypeId: string;
	start: string;
	end?: string;
	attendee: CalcomCreateBookingAttendeeInput;
	metadata?: Record<string, unknown>;
}): Record<string, unknown> {
	const timeZone = normalizeIanaTimeZoneForCalcom(params.attendee.timeZone);
	const language = params.attendee.language ?? 'en';
	return {
		eventTypeId: Number.parseInt(params.eventTypeId, 10),
		start: params.start,
		timeZone,
		language,
		...(params.end ? { end: params.end } : {}),
		attendee: {
			name: params.attendee.name,
			email: params.attendee.email,
			timeZone,
			language
		},
		metadata: params.metadata ?? {}
	};
}
