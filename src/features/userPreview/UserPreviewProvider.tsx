'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import {
	USER_PREVIEW_STORAGE_KEY,
	type UserPreviewMode,
	type UserViewMode,
	isUserPreviewMode,
	isUserViewMode
} from './userPreview';

type UserPreviewContextValue = {
	isAdmin: boolean;
	mode: UserPreviewMode | null;
	view: UserViewMode;
	setView: (view: UserViewMode) => void;
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
		if (isUserPreviewMode(storedMode)) {
			setMode(storedMode);
		} else if (storedMode) {
			window.localStorage.removeItem(USER_PREVIEW_STORAGE_KEY);
		}
	}, [isAdmin, isLoaded]);

	const value = useMemo<UserPreviewContextValue>(
		() => ({
			isAdmin,
			mode: isAdmin ? mode : null,
			view: isAdmin ? (mode ?? 'admin') : 'student',
			setView: (view: UserViewMode) => {
				if (!isAdmin) return;
				if (view === 'admin') {
					setMode(null);
					window.localStorage.removeItem(USER_PREVIEW_STORAGE_KEY);
					return;
				}
				setMode(view);
				window.localStorage.setItem(USER_PREVIEW_STORAGE_KEY, view);
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

	return (
		<div className="border-amber-300 border-b bg-amber-50 px-4 py-2 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
			<div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-2 text-sm">
				<div className="flex items-center gap-2">
					<Badge variant="outline" className="border-current">
						{t('badge')}
					</Badge>
					<span>{t('activeAs', { profile: t(`${mode}.label`) })}</span>
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
	const pathname = usePathname();
	const router = useRouter();
	const { isAdmin, view, setView } = useUserPreview();

	if (!isAdmin) return null;

	return (
		<Select
			value={view}
			onValueChange={(value) => {
				if (!isUserViewMode(value)) return;
				setView(value);
				if ((value === 'admin') !== pathname.startsWith('/admin')) {
					router.push(value === 'admin' ? '/admin' : '/');
				}
			}}
		>
			<SelectTrigger
				className="h-8 w-[7.5rem] border-muted-foreground/30 px-2 text-xs sm:w-32"
				aria-label={t('selectLabel')}
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent align="end">
				<SelectItem value="admin">{t('views.admin')}</SelectItem>
				<SelectItem value="mentor">{t('views.mentor')}</SelectItem>
				<SelectItem value="student">{t('views.student')}</SelectItem>
			</SelectContent>
		</Select>
	);
}
