'use client';

import { useAuth } from '@clerk/nextjs';
import { ChevronDown, Menu, MessageSquare, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from '~/common/components/ui/collapsible';
import { CommandDialog, CommandEmpty, CommandInput, CommandItem, CommandList } from '~/common/components/ui/command';
import { Button } from '~/common/components/ui/button';
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger
} from '~/common/components/ui/sheet';
import {
	ADMIN_DASHBOARD,
	ADMIN_NAV_GROUPS,
	isNavigationItemVisible,
	WORK_NAV_ITEMS,
	type NavigationGroup,
	type NavigationItem
} from '~/common/constants/menuItem';
import { cn } from '~/lib/utils';
import { FeedbackDialog } from '~/features/feedback/FeedbackDialog';
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
			<span>{item.label}</span>
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
						{group.label}
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
					<NavigationLink
						key={item.href}
						item={item}
						onNavigate={onNavigate}
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
	onFeedback
}: {
	workItems: NavigationItem[];
	adminDashboard?: NavigationItem;
	adminGroups: { group: NavigationGroup; items: NavigationItem[] }[];
	onNavigate?: () => void;
	onSearch: () => void;
	onFeedback?: () => void;
}) {
	return (
		<div className="flex min-h-full flex-col">
			<div className="space-y-4">
				<Button
					variant="outline"
					className="w-full justify-start gap-3 text-muted-foreground"
					onClick={onSearch}
				>
					<Search className="h-4 w-4" aria-hidden="true" />
					<span>Search</span>
					<kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
						⌘/Ctrl K
					</kbd>
				</Button>

				<nav aria-label="Main navigation" className="space-y-6">
					<section aria-labelledby="work-navigation">
						<h2
							id="work-navigation"
							className="mb-2 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider"
						>
							Work
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
								Administration
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
											key={group.label}
											item={item}
											onNavigate={onNavigate}
										/>
									) : (
										<NavigationGroupMenu
											key={group.label}
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
						Send Feedback
					</Button>
				</div>
			) : null}
		</div>
	);
}

export default function NavigationSidebar() {
	const router = useRouter();
	const { has, isLoaded, isSignedIn } = useAuth();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [feedbackOpen, setFeedbackOpen] = useState(false);
	const { data: mentorshipStatus } = api.user.getMentorshipStatus.useQuery(undefined, {
		enabled: !!isSignedIn
	});
	const hasActiveMentorship = mentorshipStatus?.mentorshipStatus === 'ACTIVE';

	const visibility = useMemo(
		() => ({
			isSignedIn: !!isSignedIn,
			hasMentorship: hasActiveMentorship,
			hasPermission: (permission: ClerkAuthorization['permission']) =>
				isLoaded && has({ permission })
		}),
		[has, hasActiveMentorship, isLoaded, isSignedIn]
	);
	const workItems = WORK_NAV_ITEMS.filter((item) =>
		isNavigationItemVisible(item, visibility)
	);
	const adminDashboard =
		isLoaded && isSignedIn && isNavigationItemVisible(ADMIN_DASHBOARD, visibility)
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
	const navigateFromSearch = (href: string) => {
		setSearchOpen(false);
		setMobileOpen(false);
		router.push(href);
	};

	return (
		<div className="md:flex md:shrink-0">
			<div className="border-b bg-background px-4 py-2 md:hidden">
				<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
					<SheetTrigger asChild>
						<Button variant="outline" className="gap-2">
							<Menu className="h-4 w-4" aria-hidden="true" />
							Menu
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="w-80 p-6">
						<SheetTitle className="sr-only">Main navigation</SheetTitle>
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

			<aside className="hidden w-64 shrink-0 border-r bg-background p-4 md:flex md:flex-col">
				<NavigationContents
					workItems={workItems}
					adminDashboard={adminDashboard}
					adminGroups={adminGroups}
					onSearch={openSearch}
					onFeedback={isSignedIn ? () => setFeedbackOpen(true) : undefined}
				/>
			</aside>

			<CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
				<CommandInput placeholder="Search navigation..." />
				<CommandList>
					<CommandEmpty>No accessible destinations found.</CommandEmpty>
					{searchableItems.map((item) => {
						const Icon = item.Icon;
						return (
							<CommandItem
								key={item.href}
								onSelect={() => navigateFromSearch(item.href)}
								value={item.label}
							>
								<Icon className="mr-2 h-4 w-4" aria-hidden="true" />
								{item.label}
							</CommandItem>
						);
					})}
				</CommandList>
			</CommandDialog>

			<FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
		</div>
	);
}
