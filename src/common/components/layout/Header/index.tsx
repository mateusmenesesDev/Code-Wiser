'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';

import { Calendar, LogIn, Moon, Sparkles, Sun } from 'lucide-react';
import { Switch } from '~/common/components/ui/switch';
import { useDialog } from '~/common/hooks/useDialog';
import SignInDialog from '~/features/auth/components/Signin/SigninDialog';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { NotificationBell } from '~/features/notifications/components/NotificationBell';
import { getUserPreviewProfile } from '~/features/userPreview/userPreview';
import { useUserPreview } from '~/features/userPreview/UserPreviewProvider';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { api } from '~/trpc/react';
import CodeWiseIcon from '../../icons/CodeWiseIcon';
import HeaderAvatarMenu from './HeaderAvatarMenu';

const Header = () => {
	const t = useTranslations('common');
	const { openDialog } = useDialog('signIn');
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const { user } = useAuth();
	const { mode: previewMode } = useUserPreview();
	const isLoggedIn = !!user;
	const {
		data: mentorshipStatus,
		isError: mentorshipStatusErrored,
		isLoading: mentorshipStatusLoading
	} = api.user.getMentorshipStatus.useQuery(undefined, {
		enabled: isLoggedIn && !previewMode
	});
	const { data: userCredits } = api.user.getCredits.useQuery(undefined, {
		enabled:
			isLoggedIn &&
			!previewMode &&
			(mentorshipStatus?.mentorshipStatus === 'INACTIVE' ||
				mentorshipStatusErrored)
	});
	const previewProfile = previewMode
		? getUserPreviewProfile(previewMode)
		: undefined;
	const hasActiveMentorship =
		previewProfile?.hasMentorship ??
		mentorshipStatus?.mentorshipStatus === 'ACTIVE';
	const shouldShowCreditsBadge =
		isLoggedIn &&
		(previewMode === 'free' ||
			(!previewMode &&
				(mentorshipStatus?.mentorshipStatus === 'INACTIVE' ||
					mentorshipStatusErrored)));

	return (
		<header className="border-b bg-background/80 backdrop-blur-md">
			<div className="w-full px-4 py-2 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between gap-6">
					<Link href="/" className="shrink-0">
						<CodeWiseIcon />
					</Link>

					<div className="flex shrink-0 items-center gap-4">
						<LanguageSwitcher />
						<div className="flex items-center gap-2">
							<Sun className="h-4 w-4" aria-hidden="true" />
							{mounted ? (
								<Switch
									checked={theme === 'dark'}
									aria-label={t('toggleDarkMode')}
									onCheckedChange={() =>
										setTheme(theme === 'dark' ? 'light' : 'dark')
									}
								/>
							) : (
								<Switch
									checked={false}
									disabled
									aria-label={t('toggleDarkMode')}
								/>
							)}
							<Moon className="h-4 w-4" aria-hidden="true" />
						</div>

						{isLoggedIn ? (
							<>
								{hasActiveMentorship ? (
									<Badge variant="success" className="whitespace-nowrap">
										<Calendar className="mr-1 h-3 w-3" aria-hidden="true" />
										{t('mentorshipActive')}
									</Badge>
								) : shouldShowCreditsBadge &&
									(previewMode || !mentorshipStatusLoading) ? (
									<Link href="/pricing" aria-label={t('viewPricing')}>
										<Badge
											variant="purple-gradient"
											className="whitespace-nowrap"
											data-onboarding="user-credits"
										>
											<Sparkles className="mr-1 h-3 w-3" aria-hidden="true" />
											{previewProfile?.credits ?? userCredits?.credits ?? 0}{' '}
											{t('credits')}
										</Badge>
									</Link>
								) : null}

								<NotificationBell />

								<HeaderAvatarMenu />
							</>
						) : (
							<div className="flex items-center gap-3">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => openDialog('signIn')}
								>
									<LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
									{t('signIn')}
								</Button>
								<Button
									onClick={() => openDialog('signIn')}
									size="sm"
									className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
								>
									{t('getStarted')}
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>

			<SignInDialog />
		</header>
	);
};

export default Header;
