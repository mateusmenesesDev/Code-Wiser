'use client';

import { useAuth } from '@clerk/nextjs';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
	localeCookie,
	localeCookieMaxAge,
	type Locale,
	userLocaleFromLocale
} from '~/i18n/locales';
import { api } from '~/trpc/react';

export function LanguageSwitcher() {
	const locale = useLocale() as Locale;
	const t = useTranslations('common');
	const router = useRouter();
	const { isSignedIn } = useAuth();
	const updateLocale = api.user.updateLocale.useMutation({
		onError: () => toast.error(t('saveLanguageError'))
	});

	const changeLocale = (nextLocale: Locale) => {
		document.cookie = `${localeCookie}=${nextLocale}; path=/; max-age=${localeCookieMaxAge}; samesite=lax`;
		if (isSignedIn) {
			updateLocale.mutate(userLocaleFromLocale(nextLocale));
		}
		router.refresh();
	};

	return (
		<label className="flex items-center gap-2 text-muted-foreground text-sm">
			<span className="sr-only">{t('language')}</span>
			<select
				value={locale}
				onChange={(event) => changeLocale(event.target.value as Locale)}
				className="rounded-md border bg-background px-2 py-1 text-foreground text-xs"
				aria-label={t('language')}
			>
				<option value="pt-BR">{t('portugueseBrazil')}</option>
				<option value="en">{t('english')}</option>
			</select>
		</label>
	);
}
