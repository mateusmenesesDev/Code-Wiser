import {
	Calendar,
	FolderOpen,
	GitPullRequest,
	UserCog,
	Users
} from 'lucide-react';

type MenuItem = {
	href: string;
	Icon: React.ComponentType<{ className?: string }>;
	label: string;
	loginRequired?: boolean;
	comingSoon?: boolean;
	orgPermission?: ClerkAuthorization;
	disabled?: boolean;
	requiresMentorship?: boolean;
};

export const MENU_ITEMS: MenuItem[] = [
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

export const MENU_ITEMS_WITH_PERMISSION: MenuItem[] = [
	{
		href: '/admin',
		Icon: Users,
		label: 'Mentor Dashboard',
		orgPermission: {
			permission: 'org:project:create',
			role: 'org:admin'
		}
	},
	{
		href: '/admin/templates',
		Icon: FolderOpen,
		label: 'Admin Templates',
		orgPermission: {
			permission: 'org:project:edit_template',
			role: 'org:admin'
		}
	},
	{
		href: '/admin/users',
		Icon: UserCog,
		label: 'User Management',
		orgPermission: {
			permission: 'org:project:create',
			role: 'org:admin'
		}
	},
	{
		href: '/admin/pr-reviews',
		Icon: GitPullRequest,
		label: 'PR Reviews',
		orgPermission: {
			permission: 'org:project:create',
			role: 'org:admin'
		}
	}
];
