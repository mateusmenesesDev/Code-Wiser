import type { LucideIcon } from 'lucide-react';
import {
	BookOpen,
	Calendar,
	ClipboardCheck,
	FolderOpen,
	GitPullRequest,
	LayoutDashboard,
	MessageSquare,
	UserCog
} from 'lucide-react';

export type NavigationItem = {
	href: string;
	Icon: LucideIcon;
	label: string;
	loginRequired?: boolean;
	requiresMentorship?: boolean;
	permission?: ClerkAuthorization['permission'];
};

export type NavigationGroup = {
	label: string;
	Icon: LucideIcon;
	items: NavigationItem[];
};

export const WORK_NAV_ITEMS: NavigationItem[] = [
	{
		href: '/',
		Icon: LayoutDashboard,
		label: 'Dashboard',
		loginRequired: true
	},
	{
		href: '/exercises',
		Icon: BookOpen,
		label: 'Exercises'
	},
	{
		href: '/my-projects',
		Icon: FolderOpen,
		label: 'My Projects',
		loginRequired: true
	},
	{
		href: '/mentorship',
		Icon: Calendar,
		label: 'Mentorship',
		loginRequired: true,
		requiresMentorship: true
	}
];

export const ADMIN_NAV_GROUPS: NavigationGroup[] = [
	{
		label: 'People',
		Icon: UserCog,
		items: [
			{
				href: '/admin/users',
				Icon: UserCog,
				label: 'People',
				permission: 'org:project:create'
			}
		]
	},
	{
		label: 'Content',
		Icon: FolderOpen,
		items: [
			{
				href: '/admin/templates',
				Icon: FolderOpen,
				label: 'Templates',
				permission: 'org:project:edit_template'
			},
			{
				href: '/admin/exercises',
				Icon: BookOpen,
				label: 'Exercise Management',
				permission: 'org:project:create'
			}
		]
	},
	{
		label: 'Reviews',
		Icon: ClipboardCheck,
		items: [
			{
				href: '/admin/pr-reviews',
				Icon: GitPullRequest,
				label: 'PR Reviews',
				permission: 'org:project:create'
			},
			{
				href: '/admin/exercise-reviews',
				Icon: ClipboardCheck,
				label: 'Exercise Reviews',
				permission: 'org:project:create'
			}
		]
	},
	{
		label: 'Feedback',
		Icon: MessageSquare,
		items: [
			{
				href: '/admin/feedback',
				Icon: MessageSquare,
				label: 'Feedback Inbox',
				permission: 'org:project:create'
			}
		]
	}
];

export const ADMIN_DASHBOARD: NavigationItem = {
	href: '/admin',
	Icon: LayoutDashboard,
	label: 'Dashboard',
	permission: 'org:project:create'
};

export const isNavigationItemVisible = (
	item: NavigationItem,
	{
		isSignedIn,
		hasMentorship,
		hasAdminRole,
		hasPermission
	}: {
		isSignedIn: boolean;
		hasMentorship: boolean;
		hasAdminRole: () => boolean;
		hasPermission: (permission: ClerkAuthorization['permission']) => boolean;
	}
) => {
	if (item.loginRequired && !isSignedIn) return false;
	if (item.requiresMentorship && !hasMentorship) return false;
	return !item.permission || hasAdminRole() || hasPermission(item.permission);
};
