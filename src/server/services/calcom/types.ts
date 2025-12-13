/**
 * Cal.com Webhook Types
 *
 * These types define the structure of webhook payloads received from Cal.com
 */

export type CalcomWebhookTriggerEvent =
	| 'BOOKING_CREATED'
	| 'BOOKING_RESCHEDULED'
	| 'BOOKING_CANCELLED'
	| 'BOOKING_REJECTED'
	| 'BOOKING_REQUESTED'
	| 'BOOKING_PAYMENT_INITIATED'
	| 'BOOKING_PAID'
	| 'FORM_SUBMITTED'
	| 'MEETING_ENDED'
	| 'RECORDING_READY'
	| 'INSTANT_MEETING'
	| 'PING';

export interface CalcomAttendee {
	name: string;
	email: string;
	timeZone: string;
	language?: {
		locale: string;
	};
	utcOffset?: number;
}

export interface CalcomOrganizer {
	name: string;
	email: string;
	timeZone: string;
	language?: {
		locale: string;
	};
	utcOffset?: number;
}

export interface CalcomBookingPayload {
	type?: string;
	title: string;
	description?: string;
	additionalNotes?: string;
	customInputs?: Record<string, unknown>;
	startTime: string;
	endTime: string;
	organizer: CalcomOrganizer;
	attendees: CalcomAttendee[];
	location?: string;
	destinationCalendar?: {
		id: number;
		integration: string;
		externalId: string;
		primaryEmail?: string;
		userId?: number;
	};
	hideCalendarNotes?: boolean;
	requiresConfirmation?: boolean;
	eventTypeId?: number;
	seatsShowAttendees?: boolean;
	seatsPerTimeSlot?: number;
	uid: string;
	id?: number;
	conferenceData?: {
		createRequest?: {
			requestId: string;
		};
	};
	videoCallData?: {
		type: string;
		id: string;
		password?: string;
		url: string;
	};
	metadata?: Record<string, unknown>;
	status?: string;
	smsReminderNumber?: string;
	rescheduleUid?: string;
	rescheduleReason?: string;
	cancellationReason?: string;
}

export interface CalcomWebhookPayload {
	triggerEvent: CalcomWebhookTriggerEvent;
	createdAt: string;
	payload: CalcomBookingPayload;
}

/**
 * Type guard to check if a webhook event is a booking event
 */
export function isBookingEvent(
	triggerEvent: CalcomWebhookTriggerEvent
): boolean {
	return [
		'BOOKING_CREATED',
		'BOOKING_RESCHEDULED',
		'BOOKING_CANCELLED',
		'BOOKING_REJECTED',
		'BOOKING_REQUESTED'
	].includes(triggerEvent);
}

/**
 * Type guard to check if payload has required booking data
 */
export function hasBookingData(
	payload: CalcomBookingPayload
): payload is Required<
	Pick<CalcomBookingPayload, 'uid' | 'startTime' | 'endTime' | 'attendees'>
> &
	CalcomBookingPayload {
	return !!(
		payload.uid &&
		payload.startTime &&
		payload.endTime &&
		payload.attendees &&
		payload.attendees.length > 0
	);
}
