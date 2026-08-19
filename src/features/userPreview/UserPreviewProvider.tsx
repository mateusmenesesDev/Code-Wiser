'use client';

import { useAuth } from '@clerk/nextjs';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import {
	getUserPreviewProfile,
	isUserPreviewMode,
	USER_PREVIEW_PROFILES,
	USER_PREVIEW_STORAGE_KEY,
	type UserPreviewMode
} from './userPreview';

type UserPreviewContextValue = {
	mode: UserPreviewMode | null;
	startPreview: (mode: UserPreviewMode) => void;
	stopPreview: () => void;
};

const UserPreviewContext = createContext<UserPreviewContextValue | null>(null);

export function UserPreviewProvider({
	children
}: { children: React.ReactNode }) {
	const { has, isLoaded, isSignedIn, orgRole } = useAuth();
	const [mode, setMode] = useState<UserPreviewMode | null>(null);
	const isAdmin =
		isLoaded &&
		!!isSignedIn &&
		(String(orgRole) === 'admin' ||
			orgRole === 'org:admin' ||
			has({ role: 'org:admin' }));

	useEffect(() => {
		if (!isLoaded) return;
		if (!isAdmin) {
			setMode(null);
			window.localStorage.removeItem(USER_PREVIEW_STORAGE_KEY);
			return;
		}

		const storedMode = window.localStorage.getItem(USER_PREVIEW_STORAGE_KEY);
		if (isUserPreviewMode(storedMode)) setMode(storedMode);
	}, [isAdmin, isLoaded]);

	const value = useMemo(
		() => ({
			mode: isAdmin ? mode : null,
			startPreview: (nextMode: UserPreviewMode) => {
				if (!isAdmin) return;
				setMode(nextMode);
				window.localStorage.setItem(USER_PREVIEW_STORAGE_KEY, nextMode);
			},
			stopPreview: () => {
				setMode(null);
				window.localStorage.removeItem(USER_PREVIEW_STORAGE_KEY);
			}
		}),
		[isAdmin, mode]
	);

	return (
		<UserPreviewContext.Provider value={value}>
			{children}
		</UserPreviewContext.Provider>
	);
}

export function useUserPreview() {
	const context = useContext(UserPreviewContext);
	if (!context) {
		throw new Error('useUserPreview must be used within UserPreviewProvider');
	}
	return context;
}

export function UserPreviewBanner() {
	const t = useTranslations('userPreview');
	const { mode, stopPreview } = useUserPreview();

	if (!mode) return null;

	const profile = getUserPreviewProfile(mode);

	return (
		<div className="border-amber-300 border-b bg-amber-50 px-4 py-2 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
			<div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-2 text-sm">
				<div className="flex items-center gap-2">
					<Badge variant="outline" className="border-current">
						{t('badge')}
					</Badge>
					<span>
						{t('activeAs', { profile: t(`${mode}.label`) })} ·{' '}
						{profile.hasMentorship
							? t('mentorshipAccess')
							: t('creditsAccess', { credits: profile.credits })}
					</span>
				</div>
				<Button
					variant="ghost"
					size="sm"
					className="h-7 px-2 text-amber-950 hover:bg-amber-100 hover:text-amber-950 dark:text-amber-100 dark:hover:bg-amber-900"
					onClick={stopPreview}
				>
					{t('exit')}
				</Button>
			</div>
		</div>
	);
}

export function UserPreviewSelector() {
	const t = useTranslations('userPreview');
	const { mode, startPreview, stopPreview } = useUserPreview();

	return (
		<Card className="mb-6 border-dashed">
			<CardHeader>
				<CardTitle level={2} className="text-lg">
					{t('title')}
				</CardTitle>
				<CardDescription>{t('description')}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-wrap gap-3">
				{(Object.keys(USER_PREVIEW_PROFILES) as UserPreviewMode[]).map(
					(previewMode) => (
						<Button
							key={previewMode}
							variant={mode === previewMode ? 'default' : 'outline'}
							onClick={() => startPreview(previewMode)}
						>
							{t(`${previewMode}.button`)}
						</Button>
					)
				)}
				{mode && (
					<Button variant="ghost" onClick={stopPreview}>
						{t('exit')}
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
