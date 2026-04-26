import { describe, expect, it } from 'vitest';
import {
	buildCalcomCreateBookingBody,
	normalizeIanaTimeZoneForCalcom
} from './calcomCreateBookingPayload';

describe('normalizeIanaTimeZoneForCalcom', () => {
	it('returns the same zone when valid', () => {
		expect(normalizeIanaTimeZoneForCalcom('America/Sao_Paulo')).toBe(
			'America/Sao_Paulo'
		);
		expect(normalizeIanaTimeZoneForCalcom('Europe/London')).toBe('Europe/London');
	});

	it('returns UTC for invalid or empty input', () => {
		expect(normalizeIanaTimeZoneForCalcom('')).toBe('UTC');
		expect(normalizeIanaTimeZoneForCalcom('   ')).toBe('UTC');
		expect(normalizeIanaTimeZoneForCalcom('Not/A-Valid-Zone')).toBe('UTC');
	});
});

describe('buildCalcomCreateBookingBody', () => {
	it('includes versioned API fields Cal.com validates on create booking', () => {
		const body = buildCalcomCreateBookingBody({
			eventTypeId: '4141124',
			start: '2026-04-27T20:00:00.000Z',
			attendee: {
				name: 'Test User',
				email: 'test@example.com',
				timeZone: 'America/New_York'
			}
		});

		expect(body).toMatchObject({
			eventTypeId: 4141124,
			start: '2026-04-27T20:00:00.000Z',
			timeZone: 'America/New_York',
			language: 'en',
			attendee: {
				name: 'Test User',
				email: 'test@example.com',
				timeZone: 'America/New_York',
				language: 'en'
			},
			metadata: {}
		});
	});

	it('uses attendee language when provided', () => {
		const body = buildCalcomCreateBookingBody({
			eventTypeId: '1',
			start: '2026-01-01T12:00:00.000Z',
			attendee: {
				name: 'A',
				email: 'a@b.co',
				timeZone: 'UTC',
				language: 'pt'
			}
		});

		expect(body.language).toBe('pt');
		expect((body.attendee as { language: string }).language).toBe('pt');
	});

	it('normalizes invalid attendee time zone on root and attendee', () => {
		const body = buildCalcomCreateBookingBody({
			eventTypeId: '1',
			start: '2026-01-01T12:00:00.000Z',
			attendee: {
				name: 'A',
				email: 'a@b.co',
				timeZone: 'Invalid/Zone'
			}
		});

		expect(body.timeZone).toBe('UTC');
		expect((body.attendee as { timeZone: string }).timeZone).toBe('UTC');
	});
});
