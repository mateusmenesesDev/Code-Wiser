import { z } from 'zod';

export const bookSessionSchema = z.object({
	start: z.string().datetime(),
	end: z.string().datetime(),
	timeZone: z.string().default('UTC')
});

export const cancelBookingSchema = z.object({
	bookingId: z.string().uuid()
});

export const getAvailableSlotsSchema = z.object({
	startDate: z.string().datetime(),
	endDate: z.string().datetime()
});
