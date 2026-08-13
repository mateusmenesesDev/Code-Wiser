import type { LucideIcon } from 'lucide-react';
import {
	BookOpen,
	Calendar,
	ClipboardCheck,
	Clock3,
	FolderOpen,
	GitPullRequest,
	LayoutDashboard,
	MessageSquare,
	Search,
	UserCog
} from 'lucide-react';

export type NavigationItem = {
	href: string;
	Icon: LucideIcon;
	labelKey: string;
	loginRequired?: boolean;
	requiresMentorship?: boolean;
	permission?: ClerkAuthorization['permission'];
};

export type NavigationGroup = {
	labelKey: string;
	Icon: LucideIcon;
	items: NavigationItem[];
};

export const WORK_NAV_ITEMS: NavigationItem[] = [
	{
		href: '/',
		Icon: LayoutDashboard,
		labelKey: 'dashboard',
		loginRequired: true
	},
	{
		href: '/projects',
		Icon: Search,
		labelKey: 'projectCatalog'
	},
	{
		href: '/exercises',
		Icon: BookOpen,
		labelKey: 'exercises'
	},
	{
		href: '/my-projects',
		Icon: FolderOpen,
		labelKey: 'myProjects',
		loginRequired: true
	},
	{
		href: '/agenda',
		Icon: Calendar,
		labelKey: 'taskAgenda',
		loginRequired: true
	},
	{
		href: '/mentorship',
		Icon: Calendar,
		labelKey: 'mentorship',
		loginRequired: true,
		requiresMentorship: true
	}
];

export const ADMIN_NAV_GROUPS: NavigationGroup[] = [
	{
		labelKey: 'people',
		Icon: UserCog,
		items: [
			{
				href: '/admin/users',
				Icon: UserCog,
				labelKey: 'people',
				permission: 'org:project:create'
			}
		]
	},
	{
		labelKey: 'content',
		Icon: FolderOpen,
		items: [
			{
				href: '/admin/templates',
				Icon: FolderOpen,
				labelKey: 'templates',
				permission: 'org:project:edit_template'
			},
			{
				href: '/admin/exercises',
				Icon: BookOpen,
				labelKey: 'exerciseManagement',
				permission: 'org:project:create'
			}
		]
	},
	{
		labelKey: 'reviews',
		Icon: ClipboardCheck,
		items: [
			{
				href: '/admin/attention',
				Icon: Clock3,
				labelKey: 'attentionQueue',
				permission: 'org:project:create'
			},
			{
				href: '/admin/pr-reviews',
				Icon: GitPullRequest,
				labelKey: 'prReviews',
				permission: 'org:project:create'
			},
			{
				href: '/admin/exercise-reviews',
				Icon: ClipboardCheck,
				labelKey: 'exerciseReviews',
				permission: 'org:project:create'
			},
			{
				href: '/admin/mentorship',
				Icon: Calendar,
				labelKey: 'mentorshipSessions',
				permission: 'org:project:create'
			}
		]
	},
	{
		labelKey: 'feedbackGroup',
		Icon: MessageSquare,
		items: [
			{
				href: '/admin/feedback',
				Icon: MessageSquare,
				labelKey: 'feedbackInbox',
				permission: 'org:project:create'
			}
		]
	}
];

export const ADMIN_DASHBOARD: NavigationItem = {
	href: '/admin',
	Icon: LayoutDashboard,
	labelKey: 'dashboard',
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
