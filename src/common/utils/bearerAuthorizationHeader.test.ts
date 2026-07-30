import { describe, expect, it } from 'vitest';
import { bearerAuthorizationHeader } from './bearerAuthorizationHeader';

describe('bearerAuthorizationHeader', () => {
	it('prefixes a raw token', () => {
		expect(bearerAuthorizationHeader('cal_live_abc')).toBe('Bearer cal_live_abc');
	});

	it('does not double-prefix when the credential already includes Bearer', () => {
		expect(bearerAuthorizationHeader('Bearer cal_live_abc')).toBe(
			'Bearer cal_live_abc'
		);
		expect(bearerAuthorizationHeader('  bearer  cal_live_abc  ')).toBe(
			'Bearer cal_live_abc'
		);
	});

	it('strips wrapping quotes and line breaks from pasted secrets', () => {
		expect(bearerAuthorizationHeader('"cal_live_abc"')).toBe('Bearer cal_live_abc');
		expect(bearerAuthorizationHeader("'cal_live_abc'\n")).toBe('Bearer cal_live_abc');
		expect(bearerAuthorizationHeader('cal_live_abc\r\n')).toBe('Bearer cal_live_abc');
	});
});
