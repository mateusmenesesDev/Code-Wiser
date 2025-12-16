import { env } from '~/env';

const CALCOM_API_BASE_URL = 'https://api.cal.com/v2';

interface CalcomAvailabilitySlot {
	start: string;
	end: string;
}

interface CalcomBookingResponse {
	id: string;
	uid: string;
	eventTypeId: number;
	title: string;
	description: string | null;
	startTime: string;
	endTime: string;
	status: string;
}

interface CalcomCreateBookingParams {
	eventTypeId: string;
	start: string;
	end: string;
	attendee: {
		name: string;
		email: string;
		timeZone: string;
	};
	meetingUrl?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Get available time slots from Cal.com for a specific date range
 */
export async function getAvailableSlots(
	startDate: Date,
	endDate: Date
): Promise<CalcomAvailabilitySlot[]> {
	try {
		const startISO = startDate.toISOString();
		const endISO = endDate.toISOString();

		const response = await fetch(
			`${CALCOM_API_BASE_URL}/slots/available?eventTypeId=${env.CALCOM_EVENT_TYPE_ID}&startTime=${startISO}&endTime=${endISO}`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${env.CALCOM_API_KEY}`,
					'Content-Type': 'application/json'
				}
			}
		);

		console.log('response', response);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Cal.com API error: ${response.status} - ${errorText}`);
		}

		const data = (await response.json()) as {
			data?: { slots?: Record<string, CalcomAvailabilitySlot[]> };
		};

		// Cal.com returns slots grouped by date
		const allSlots: CalcomAvailabilitySlot[] = [];
		if (data.data?.slots) {
			for (const dateSlots of Object.values(data.data.slots)) {
				allSlots.push(...dateSlots);
			}
		}

		return allSlots;
	} catch (error) {
		console.error('Error fetching Cal.com availability:', error);
		throw new Error(
			`Failed to fetch available slots: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Create a booking in Cal.com
 */
export async function createBooking(
	params: CalcomCreateBookingParams
): Promise<CalcomBookingResponse> {
	try {
		const response = await fetch(`${CALCOM_API_BASE_URL}/bookings`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.CALCOM_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				eventTypeId: Number.parseInt(params.eventTypeId, 10),
				start: params.start,
				end: params.end,
				attendee: params.attendee,
				metadata: params.metadata || {}
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Cal.com API error: ${response.status} - ${errorText}`);
		}

		const data = (await response.json()) as { data: CalcomBookingResponse };
		return data.data;
	} catch (error) {
		console.error('Error creating Cal.com booking:', error);
		throw new Error(
			`Failed to create booking: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Cancel a booking in Cal.com
 * Note: When using API key authentication, we authenticate as the host,
 * so Cal.com requires a cancellation reason.
 *
 * The reason must be a non-empty string. Cal.com validates this strictly.
 */
export async function cancelBooking(
	bookingUid: string,
	reason?: string
): Promise<void> {
	try {
		// Ensure reason is always a non-empty string with minimum length
		// Cal.com requires a reason when cancelling as the host (API key auth)
		// The reason must be a valid, non-empty string (minimum 1 character)
		let cancellationReason: string;

		if (reason && typeof reason === 'string') {
			const trimmed = reason.trim();
			if (trimmed.length > 0) {
				cancellationReason = trimmed;
			} else {
				cancellationReason = 'Booking cancelled by attendee';
			}
		} else {
			cancellationReason = 'Booking cancelled by attendee';
		}

		// Final validation - ensure it's a non-empty string
		if (
			!cancellationReason ||
			typeof cancellationReason !== 'string' ||
			cancellationReason.length === 0
		) {
			throw new Error(
				`Cancellation reason must be a non-empty string. Received: ${JSON.stringify(reason)}`
			);
		}

		// Cal.com API v2 requires:
		// 1. Field name: "cancellationReason" (not "reason")
		// 2. Header: "cal-api-version: 2024-08-13"
		// See: https://cal.com/docs/api-reference/v2/bookings/cancel-a-booking
		const requestBody = {
			cancellationReason: cancellationReason
		};

		const requestUrl = `${CALCOM_API_BASE_URL}/bookings/${bookingUid}/cancel`;
		const requestPayload = JSON.stringify(requestBody);

		console.log(
			`[Cal.com] Cancelling booking ${bookingUid} with cancellationReason: "${cancellationReason}"`
		);
		console.log(`[Cal.com] Request URL: ${requestUrl}`);
		console.log(`[Cal.com] Request payload: ${requestPayload}`);

		const response = await fetch(requestUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.CALCOM_API_KEY}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
				'cal-api-version': '2024-08-13' // Required for API v2
			},
			body: requestPayload
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				`[Cal.com] Cancel booking failed: ${response.status} - ${errorText}`
			);
			console.error(
				`[Cal.com] Request body was: ${JSON.stringify(requestBody)}`
			);
			throw new Error(`Cal.com API error: ${response.status} - ${errorText}`);
		}

		console.log(`[Cal.com] Booking ${bookingUid} cancelled successfully`);
	} catch (error) {
		console.error('Error cancelling Cal.com booking:', error);
		throw new Error(
			`Failed to cancel booking: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Get booking details from Cal.com
 */
export async function getBooking(
	bookingUid: string
): Promise<CalcomBookingResponse> {
	try {
		const response = await fetch(
			`${CALCOM_API_BASE_URL}/bookings/${bookingUid}`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${env.CALCOM_API_KEY}`,
					'Content-Type': 'application/json'
				}
			}
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Cal.com API error: ${response.status} - ${errorText}`);
		}

		const data = (await response.json()) as { data: CalcomBookingResponse };
		return data.data;
	} catch (error) {
		console.error('Error fetching Cal.com booking:', error);
		throw new Error(
			`Failed to fetch booking: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}
