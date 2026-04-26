import { describe, expect, it } from 'vitest';
import { calcomBearerAuthHeader } from './calcomAuthorizationHeader';

describe('calcomBearerAuthHeader', () => {
	it('prefixes a raw Cal.com API key', () => {
		expect(calcomBearerAuthHeader('cal_live_abc')).toBe('Bearer cal_live_abc');
	});

	it('does not double-prefix when the secret already includes Bearer', () => {
		expect(calcomBearerAuthHeader('Bearer cal_live_abc')).toBe(
			'Bearer cal_live_abc'
		);
		expect(calcomBearerAuthHeader('  bearer  cal_live_abc  ')).toBe(
			'Bearer cal_live_abc'
		);
	});
});
