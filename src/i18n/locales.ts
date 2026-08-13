export const locales = ['pt-BR', 'en'] as const;

export type Locale = (typeof locales)[number];
export type UserLocale = 'PT_BR' | 'EN';

export const defaultLocale: Locale = 'pt-BR';
export const localeCookie = 'codewise-locale';
export const localeCookieMaxAge = 60 * 60 * 24 * 365;

export function isLocale(value: string | undefined): value is Locale {
	return value === 'pt-BR' || value === 'en';
}

export function localeFromUserLocale(
	value: UserLocale | null | undefined
): Locale {
	return value === 'EN' ? 'en' : defaultLocale;
}

export function userLocaleFromLocale(locale: Locale): UserLocale {
	return locale === 'en' ? 'EN' : 'PT_BR';
}

export function resolveLocale(
	cookieLocale: string | undefined,
	acceptLanguage: string | null | undefined
): Locale {
	if (isLocale(cookieLocale)) {
		return cookieLocale;
	}

	for (const preference of (acceptLanguage ?? '').split(',')) {
		const language = preference.split(';')[0]?.trim().toLowerCase();
		if (language === 'en' || language?.startsWith('en-')) return 'en';
		if (language === 'pt' || language?.startsWith('pt-')) return 'pt-BR';
	}

	return defaultLocale;
}
