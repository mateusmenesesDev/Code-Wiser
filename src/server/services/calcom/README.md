# Cal.com Service

This directory contains the Cal.com integration services and types.

## Files

### `calcomService.ts`
Service layer for interacting with the Cal.com API:
- `getAvailableSlots()` - Fetch available time slots
- `createBooking()` - Create a new booking
- `cancelBooking()` - Cancel an existing booking
- `getBookingDetails()` - Get details of a booking

### `types.ts`
TypeScript type definitions for Cal.com webhooks and API responses:
- `CalcomWebhookPayload` - Main webhook payload structure
- `CalcomBookingPayload` - Booking event data
- `CalcomAttendee` - Attendee information
- `CalcomOrganizer` - Organizer information
- `CalcomWebhookTriggerEvent` - All possible webhook events

### `index.ts`
Centralized exports for easy imports

## Usage

### Importing Types

```typescript
import type { 
  CalcomWebhookPayload, 
  CalcomBookingPayload 
} from '~/server/services/calcom';
```

### Using the Service

```typescript
import { 
  getAvailableSlots, 
  createBooking, 
  cancelBooking 
} from '~/server/services/calcom';

// Get available slots
const slots = await getAvailableSlots({
  eventTypeId: 123,
  startTime: '2025-01-15T00:00:00Z',
  endTime: '2025-01-15T23:59:59Z',
  timeZone: 'America/New_York'
});

// Create a booking
const booking = await createBooking({
  eventTypeId: 123,
  start: '2025-01-15T14:00:00Z',
  end: '2025-01-15T15:00:00Z',
  responses: {
    name: 'John Doe',
    email: 'john@example.com'
  },
  timeZone: 'America/New_York'
});

// Cancel a booking
await cancelBooking({
  bookingUid: 'abc123xyz',
  cancellationReason: 'User requested'
});
```

## Webhook Events

The service handles these Cal.com webhook events:

### Handled Events
- **BOOKING_CREATED** - New booking created
- **BOOKING_RESCHEDULED** - Booking time changed
- **BOOKING_CANCELLED** - Booking cancelled
- **PING** - Test event (webhook configuration test)

### Logged Events (Not Processed)
- **BOOKING_REJECTED** - Booking rejected by organizer
- **BOOKING_REQUESTED** - Booking requires confirmation

### Other Events (Ignored)
- `BOOKING_PAYMENT_INITIATED`
- `BOOKING_PAID`
- `FORM_SUBMITTED`
- `MEETING_ENDED`
- `RECORDING_READY`
- `INSTANT_MEETING`

## Type Guards

The types module includes helpful type guards:

```typescript
import { isBookingEvent, hasBookingData } from '~/server/services/calcom';

// Check if event is a booking-related event
if (isBookingEvent(triggerEvent)) {
  // Handle booking event
}

// Check if payload has required booking data
if (hasBookingData(payload)) {
  // TypeScript now knows uid, startTime, endTime, attendees are defined
  console.log(payload.uid);
}
```

## Environment Variables

Required environment variables for Cal.com integration:

```bash
CALCOM_API_KEY=your_api_key
CALCOM_EVENT_TYPE_ID=your_event_type_id
CALCOM_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_CALCOM_USERNAME=your_username
```

## Related Documentation

- [Webhook Setup Guide](../../../../docs/CALCOM_WEBHOOK_SETUP.md)
- [Mentorship Implementation Summary](../../../../docs/MENTORSHIP_IMPLEMENTATION_SUMMARY.md)
- [Quick Webhook Secret Setup](../../../../docs/WEBHOOK_SECRET_SETUP.md)

