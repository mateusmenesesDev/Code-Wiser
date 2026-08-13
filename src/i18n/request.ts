import { auth } from '@clerk/nextjs/server';
import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import {
	localeCookie,
	localeFromUserLocale,
	resolveLocale,
	type UserLocale
} from './locales';
import { db } from '~/server/db';

export default getRequestConfig(async () => {
	const cookieLocale = cookies().get(localeCookie)?.value;
	let userLocale: UserLocale | undefined;

	if (!cookieLocale) {
		try {
			const { userId } = auth();
			if (userId) {
				userLocale = (
					await db.user.findUnique({
						where: { id: userId },
						select: { preferredLocale: true }
					})
				)?.preferredLocale;
			}
		} catch {
			// Static generation has no Clerk session or database request context.
		}
	}

	const locale = resolveLocale(
		cookieLocale ?? (userLocale ? localeFromUserLocale(userLocale) : undefined),
		headers().get('accept-language')
	);

	return {
		locale,
		messages:
			locale === 'en'
				? (await import('./messages/en.json')).default
				: (await import('./messages/pt-BR.json')).default
	};
});
