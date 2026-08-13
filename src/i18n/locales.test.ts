import { describe, expect, it } from 'vitest';
import {
	defaultLocale,
	localeFromUserLocale,
	resolveLocale,
	userLocaleFromLocale
} from './locales';

describe('locale resolution', () => {
	it('prefers an explicit cookie over browser preferences', () => {
		expect(resolveLocale('en', 'pt-BR,pt;q=0.9')).toBe('en');
	});

	it('detects supported browser languages and falls back to Portuguese', () => {
		expect(resolveLocale(undefined, 'en-US,en;q=0.9')).toBe('en');
		expect(resolveLocale(undefined, 'pt-PT,pt;q=0.9')).toBe('pt-BR');
		expect(resolveLocale(undefined, 'fr-FR')).toBe(defaultLocale);
	});

	it('maps the persisted user preference to the request locale', () => {
		expect(localeFromUserLocale('EN')).toBe('en');
		expect(localeFromUserLocale('PT_BR')).toBe('pt-BR');
		expect(userLocaleFromLocale('en')).toBe('EN');
		expect(userLocaleFromLocale('pt-BR')).toBe('PT_BR');
	});
});
