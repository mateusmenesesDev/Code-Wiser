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
import { useUserPreview } from '~/features/userPreview/UserPreviewProvider';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';

const isActivePath = (pathname: string, href: string) =>
	pathname === href || pathname.startsWith(`${href}/`);

function NavigationLink({
	item,
	onNavigate,
	collapsed = false
}: {
	item: NavigationItem;
	onNavigate?: () => void;
	collapsed?: boolean;
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
				collapsed && 'justify-center px-2',
				active
					? 'bg-primary/10 text-primary'
					: 'text-muted-foreground hover:bg-accent hover:text-foreground'
			)}
			title={collapsed ? t(item.labelKey) : undefined}
		>
			<Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
			<span className={collapsed ? 'sr-only' : undefined}>
				{t(item.labelKey)}
			</span>
		</Link>
	);
}

function NavigationGroupMenu({
	group,
	items,
	onNavigate,
	collapsed = false
}: {
	group: NavigationGroup;
	items: NavigationItem[];
	onNavigate?: () => void;
	collapsed?: boolean;
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
					className={cn(
						'h-9 w-full justify-between px-3 font-semibold text-muted-foreground',
						collapsed && 'justify-center px-2'
					)}
					title={collapsed ? t(group.labelKey) : undefined}
				>
					<span className="flex items-center gap-3">
						<Icon className="h-4 w-4" aria-hidden="true" />
						<span className={collapsed ? 'sr-only' : undefined}>
							{t(group.labelKey)}
						</span>
					</span>
					{collapsed ? null : (
						<ChevronDown
							className={cn(
								'h-4 w-4 transition-transform',
								!open && '-rotate-90'
							)}
							aria-hidden="true"
						/>
					)}
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className={cn('space-y-1', !collapsed && 'pl-3')}>
				{items.map((item) => (
					<NavigationLink
						key={item.href}
						item={item}
						onNavigate={onNavigate}
						collapsed={collapsed}
					/>
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
	onFeedback,
	collapsed = false
}: {
	workItems: NavigationItem[];
	adminDashboard?: NavigationItem;
	adminGroups: { group: NavigationGroup; items: NavigationItem[] }[];
	onNavigate?: () => void;
	onSearch: () => void;
	onFeedback?: () => void;
	collapsed?: boolean;
}) {
	const t = useTranslations('navigation');

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
				<Button
					variant="outline"
					className={cn(
						'w-full justify-start gap-3 text-muted-foreground',
						collapsed && 'justify-center px-2'
					)}
					onClick={onSearch}
					title={collapsed ? t('search') : undefined}
				>
					<Search className="h-4 w-4" aria-hidden="true" />
					<span className={collapsed ? 'sr-only' : undefined}>
						{t('search')}
					</span>
					<kbd
						className={cn(
							'ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline',
							collapsed && 'sm:hidden'
						)}
					>
						⌘/Ctrl K
					</kbd>
				</Button>

				<nav aria-label={t('mainNavigation')} className="space-y-6">
					<section aria-labelledby="work-navigation">
						<h2
							id="work-navigation"
							className={cn(
								'mb-2 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider',
								collapsed && 'sr-only'
							)}
						>
							{t('work')}
						</h2>
						<div className="space-y-1">
							{workItems.map((item) => (
								<NavigationLink
									key={item.href}
									item={item}
									onNavigate={onNavigate}
									collapsed={collapsed}
								/>
							))}
						</div>
					</section>

					{adminDashboard || adminGroups.length > 0 ? (
						<section aria-labelledby="administration-navigation">
							<h2
								id="administration-navigation"
								className={cn(
									'mb-2 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider',
									collapsed && 'sr-only'
								)}
							>
								{t('administration')}
							</h2>
							<div className="space-y-1">
								{adminDashboard ? (
									<NavigationLink
										item={adminDashboard}
										onNavigate={onNavigate}
										collapsed={collapsed}
									/>
								) : null}
								{adminGroups.map(({ group, items }) => {
									const item = items[0];

									return items.length === 1 && item ? (
										<NavigationLink
											key={group.labelKey}
											item={item}
											onNavigate={onNavigate}
											collapsed={collapsed}
										/>
									) : (
										<NavigationGroupMenu
											key={group.labelKey}
											group={group}
											items={items}
											onNavigate={onNavigate}
											collapsed={collapsed}
										/>
									);
								})}
							</div>
						</section>
					) : null}
				</nav>
			</div>

			{onFeedback ? (
				<div className="shrink-0 border-t pt-4">
					<Button
						variant="ghost"
						className={cn(
							'w-full justify-start gap-3 text-muted-foreground',
							collapsed && 'justify-center px-2'
						)}
						title={collapsed ? t('sendFeedback') : undefined}
						onClick={() => {
							onFeedback();
							onNavigate?.();
						}}
					>
						<MessageSquare className="h-4 w-4" aria-hidden="true" />
						<span className={collapsed ? 'sr-only' : undefined}>
							{t('sendFeedback')}
						</span>
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
	const [desktopExpanded, setDesktopExpanded] = useState(true);
	const [searchOpen, setSearchOpen] = useState(false);
	const [feedbackOpen, setFeedbackOpen] = useState(false);
	const { mode: previewMode } = useUserPreview();
	const { data: mentorshipStatus } = api.user.getMentorshipStatus.useQuery(
		undefined,
		{
			enabled: !!isSignedIn && !previewMode
		}
	);
	const hasActiveMentorship =
		previewMode === 'mentorship' ||
		mentorshipStatus?.mentorshipStatus === 'ACTIVE';

	const visibility = useMemo(
		() => ({
			isSignedIn: !!isSignedIn,
			hasMentorship: hasActiveMentorship,
			hasAdminRole: () =>
				!previewMode &&
				isLoaded &&
				(String(orgRole) === 'admin' ||
					orgRole === 'org:admin' ||
					has({ role: 'org:admin' })),
			hasPermission: (permission: ClerkAuthorization['permission']) =>
				!previewMode && isLoaded && has({ permission })
		}),
		[has, hasActiveMentorship, isLoaded, isSignedIn, orgRole, previewMode]
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
		<div className="md:flex md:shrink-0">
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

			<aside
				className={cn(
					'hidden shrink-0 border-r bg-background md:flex md:flex-col',
					desktopExpanded ? 'w-64 p-4' : 'w-16 p-2'
				)}
			>
				<div
					className={cn(
						'mb-2 flex',
						desktopExpanded ? 'justify-end' : 'justify-center'
					)}
				>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setDesktopExpanded((expanded) => !expanded)}
						aria-expanded={desktopExpanded}
						aria-label={t(desktopExpanded ? 'closeSidebar' : 'openSidebar')}
						title={t(desktopExpanded ? 'closeSidebar' : 'openSidebar')}
					>
						{desktopExpanded ? (
							<PanelLeftClose className="h-4 w-4" aria-hidden="true" />
						) : (
							<PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
						)}
					</Button>
				</div>
				<NavigationContents
					workItems={workItems}
					adminDashboard={adminDashboard}
					adminGroups={adminGroups}
					onSearch={openSearch}
					onFeedback={isSignedIn ? () => setFeedbackOpen(true) : undefined}
					collapsed={!desktopExpanded}
				/>
			</aside>

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
