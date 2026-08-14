'use client';

import { useAuth } from '@clerk/nextjs';
import {
	ChevronDown,
	Menu,
	MessageSquare,
	PanelLeftClose,
	PanelLeftOpen,
	Search
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '~/common/components/ui/button';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from '~/common/components/ui/collapsible';
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger
} from '~/common/components/ui/sheet';
import {
	ADMIN_DASHBOARD,
	ADMIN_NAV_GROUPS,
	type NavigationGroup,
	type NavigationItem,
	WORK_NAV_ITEMS,
	isNavigationItemVisible
} from '~/common/constants/menuItem';
import { FeedbackDialog } from '~/features/feedback/FeedbackDialog';
import { GlobalSearchDialog } from '~/features/search/components/GlobalSearchDialog';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';

const isActivePath = (pathname: string, href: string) =>
	pathname === href || pathname.startsWith(`${href}/`);

function NavigationLink({
	item,
	onNavigate
}: {
	item: NavigationItem;
	onNavigate?: () => void;
}) {
	const pathname = usePathname();
	const t = useTranslations('navigation');
	const Icon = item.Icon;
	const active = isActivePath(pathname, item.href);

	return (
		<Link
			href={item.href}
			onClick={onNavigate}
			aria-current={active ? 'page' : undefined}
			data-onboarding={
				item.href === '/my-projects' ? 'my-projects-access' : undefined
			}
			className={cn(
				'flex items-center gap-3 rounded-md px-3 py-2 font-medium text-sm transition-colors',
				active
					? 'bg-primary/10 text-primary'
					: 'text-muted-foreground hover:bg-accent hover:text-foreground'
			)}
		>
			<Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
			<span>{t(item.labelKey)}</span>
		</Link>
	);
}

function NavigationGroupMenu({
	group,
	items,
	onNavigate
}: {
	group: NavigationGroup;
	items: NavigationItem[];
	onNavigate?: () => void;
}) {
	const pathname = usePathname();
	const t = useTranslations('navigation');
	const hasActiveItem = items.some((item) => isActivePath(pathname, item.href));
	const [open, setOpen] = useState(true);
	const Icon = group.Icon;

	useEffect(() => {
		if (hasActiveItem) setOpen(true);
	}, [hasActiveItem]);

	return (
		<Collapsible open={open} onOpenChange={setOpen} className="space-y-1">
			<CollapsibleTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-9 w-full justify-between px-3 font-semibold text-muted-foreground"
				>
					<span className="flex items-center gap-3">
						<Icon className="h-4 w-4" aria-hidden="true" />
						{t(group.labelKey)}
					</span>
					<ChevronDown
						className={cn(
							'h-4 w-4 transition-transform',
							!open && '-rotate-90'
						)}
						aria-hidden="true"
					/>
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className="space-y-1 pl-3">
				{items.map((item) => (
					<NavigationLink key={item.href} item={item} onNavigate={onNavigate} />
				))}
			</CollapsibleContent>
		</Collapsible>
	);
}

function NavigationContents({
	workItems,
	adminDashboard,
	adminGroups,
	onNavigate,
	onSearch,
	onFeedback
}: {
	workItems: NavigationItem[];
	adminDashboard?: NavigationItem;
	adminGroups: { group: NavigationGroup; items: NavigationItem[] }[];
	onNavigate?: () => void;
	onSearch: () => void;
	onFeedback?: () => void;
}) {
	const t = useTranslations('navigation');

	return (
		<div className="flex min-h-full flex-col">
			<div className="space-y-4">
				<Button
					variant="outline"
					className="w-full justify-start gap-3 text-muted-foreground"
					onClick={onSearch}
				>
					<Search className="h-4 w-4" aria-hidden="true" />
					<span>{t('search')}</span>
					<kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
						⌘/Ctrl K
					</kbd>
				</Button>

				<nav aria-label={t('mainNavigation')} className="space-y-6">
					<section aria-labelledby="work-navigation">
						<h2
							id="work-navigation"
							className="mb-2 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider"
						>
							{t('work')}
						</h2>
						<div className="space-y-1">
							{workItems.map((item) => (
								<NavigationLink
									key={item.href}
									item={item}
									onNavigate={onNavigate}
								/>
							))}
						</div>
					</section>

					{adminDashboard || adminGroups.length > 0 ? (
						<section aria-labelledby="administration-navigation">
							<h2
								id="administration-navigation"
								className="mb-2 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider"
							>
								{t('administration')}
							</h2>
							<div className="space-y-1">
								{adminDashboard ? (
									<NavigationLink
										item={adminDashboard}
										onNavigate={onNavigate}
									/>
								) : null}
								{adminGroups.map(({ group, items }) => {
									const item = items[0];

									return items.length === 1 && item ? (
										<NavigationLink
											key={group.labelKey}
											item={item}
											onNavigate={onNavigate}
										/>
									) : (
										<NavigationGroupMenu
											key={group.labelKey}
											group={group}
											items={items}
											onNavigate={onNavigate}
										/>
									);
								})}
							</div>
						</section>
					) : null}
				</nav>
			</div>

			{onFeedback ? (
				<div className="mt-auto border-t pt-4">
					<Button
						variant="ghost"
						className="w-full justify-start gap-3 text-muted-foreground"
						onClick={() => {
							onFeedback();
							onNavigate?.();
						}}
					>
						<MessageSquare className="h-4 w-4" aria-hidden="true" />
						{t('sendFeedback')}
					</Button>
				</div>
			) : null}
		</div>
	);
}

export default function NavigationSidebar() {
	const t = useTranslations('navigation');
	const { has, isLoaded, isSignedIn, orgRole } = useAuth();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [desktopOpen, setDesktopOpen] = useState(true);
	const [searchOpen, setSearchOpen] = useState(false);
	const [feedbackOpen, setFeedbackOpen] = useState(false);
	const { data: mentorshipStatus } = api.user.getMentorshipStatus.useQuery(
		undefined,
		{
			enabled: !!isSignedIn
		}
	);
	const hasActiveMentorship = mentorshipStatus?.mentorshipStatus === 'ACTIVE';

	const visibility = useMemo(
		() => ({
			isSignedIn: !!isSignedIn,
			hasMentorship: hasActiveMentorship,
			hasAdminRole: () =>
				isLoaded &&
				(String(orgRole) === 'admin' ||
					orgRole === 'org:admin' ||
					has({ role: 'org:admin' })),
			hasPermission: (permission: ClerkAuthorization['permission']) =>
				isLoaded && has({ permission })
		}),
		[has, hasActiveMentorship, isLoaded, isSignedIn, orgRole]
	);
	const workItems = WORK_NAV_ITEMS.filter((item) =>
		isNavigationItemVisible(item, visibility)
	);
	const adminDashboard =
		isLoaded &&
		isSignedIn &&
		isNavigationItemVisible(ADMIN_DASHBOARD, visibility)
			? ADMIN_DASHBOARD
			: undefined;
	const adminGroups = ADMIN_NAV_GROUPS.map((group) => ({
		group,
		items: group.items.filter((item) =>
			isNavigationItemVisible(item, visibility)
		)
	})).filter(({ items }) => items.length > 0);
	const searchableItems = [
		...workItems,
		...(adminDashboard ? [adminDashboard] : []),
		...adminGroups.flatMap(({ items }) => items)
	];

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				setSearchOpen(true);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	const openSearch = () => {
		setMobileOpen(false);
		setSearchOpen(true);
	};
	const closeMobileNavigation = () => setMobileOpen(false);
	return (
		<div
			className={cn('relative md:flex md:shrink-0', !desktopOpen && 'md:w-0')}
		>
			<div className="border-b bg-background px-4 py-2 md:hidden">
				<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
					<SheetTrigger asChild>
						<Button variant="outline" className="gap-2">
							<Menu className="h-4 w-4" aria-hidden="true" />
							{t('menu')}
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="w-80 p-6">
						<SheetTitle className="sr-only">{t('mainNavigation')}</SheetTitle>
						<NavigationContents
							workItems={workItems}
							adminDashboard={adminDashboard}
							adminGroups={adminGroups}
							onNavigate={closeMobileNavigation}
							onSearch={openSearch}
							onFeedback={isSignedIn ? () => setFeedbackOpen(true) : undefined}
						/>
					</SheetContent>
				</Sheet>
			</div>

			{desktopOpen ? (
				<aside className="hidden w-64 shrink-0 border-r bg-background p-4 md:flex md:flex-col">
					<div className="mb-2 flex justify-end">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setDesktopOpen(false)}
							aria-label={t('closeSidebar')}
							title={t('closeSidebar')}
						>
							<PanelLeftClose className="h-4 w-4" aria-hidden="true" />
						</Button>
					</div>
					<NavigationContents
						workItems={workItems}
						adminDashboard={adminDashboard}
						adminGroups={adminGroups}
						onSearch={openSearch}
						onFeedback={isSignedIn ? () => setFeedbackOpen(true) : undefined}
					/>
				</aside>
			) : (
				<Button
					variant="outline"
					size="icon"
					className="fixed top-[4.5rem] left-2 z-20 hidden md:inline-flex"
					onClick={() => setDesktopOpen(true)}
					aria-label={t('openSidebar')}
					title={t('openSidebar')}
				>
					<PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
				</Button>
			)}

			<GlobalSearchDialog
				open={searchOpen}
				onOpenChange={setSearchOpen}
				searchableItems={searchableItems}
				onNavigate={closeMobileNavigation}
			/>

			<FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
		</div>
	);
}
