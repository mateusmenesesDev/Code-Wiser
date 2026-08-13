import { describe, expect, it } from 'vitest';
import { validationMessageKey } from './validationMessage';

describe('validationMessageKey', () => {
	it('maps known schema messages to localized keys', () => {
		expect(validationMessageKey('Invalid email address')).toBe('invalidEmail');
		expect(validationMessageKey('Title is required')).toBe('titleRequired');
	});

	it('leaves unknown messages available to render unchanged', () => {
		expect(validationMessageKey('A domain-specific error')).toBeUndefined();
	});
});
