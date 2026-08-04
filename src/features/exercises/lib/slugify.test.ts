import { describe, expect, it } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
	it('converts accented titles to kebab-case', () => {
		expect(slugify('Lógica de Programação')).toBe('logica-de-programacao');
	});

	it('strips invalid characters', () => {
		expect(slugify('  React!!! Hooks  ')).toBe('react-hooks');
	});
});
