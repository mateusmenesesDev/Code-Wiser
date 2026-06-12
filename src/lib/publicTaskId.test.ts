import { describe, expect, it } from 'vitest';
import { formatPublicTaskId, generatePublicCode } from './publicTaskId';

describe('public task ids', () => {
	it('generates stable display codes from titles', () => {
		expect(generatePublicCode('Code Wiser CRM')).toBe('CODEWISERCRM');
		expect(generatePublicCode('Ágil: loja #42')).toBe('AGILLOJA42');
		expect(generatePublicCode('!!!')).toBe('PROJECT');
	});

	it('formats display-only task ids when code and number exist', () => {
		expect(formatPublicTaskId('CODE', 7)).toBe('CODE-7');
		expect(formatPublicTaskId('CODE', null)).toBeNull();
		expect(formatPublicTaskId(null, 7)).toBeNull();
	});
});
