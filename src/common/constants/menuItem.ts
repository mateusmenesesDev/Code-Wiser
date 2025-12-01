import { FolderOpen, Users, UserCog, GitPullRequest } from 'lucide-react';

type MenuItem = {
	href: string;
	Icon: React.ComponentType<{ className?: string }>;
	label: string;
	loginRequired?: boolean;
	comingSoon?: boolean;
	orgPermission?: ClerkAuthorization;
	disabled?: boolean;
};

export const MENU_ITEMS: MenuItem[] = [
	// {
	// 	href: '/',
	// 	Icon: Layout,
	// 	label: 'Dashboard',
	// 	comingSoon: true,
	// 	loginRequired: true
	// },
	{
		href: '/my-projects',
		Icon: FolderOpen,
		label: 'My Projects',
		loginRequired: true
	}
	// {
	// 	href: '/mentors',
	// 	Icon: Users,
	// 	label: 'Mentors',
	// 	comingSoon: true,
	// 	loginRequired: true
	// },
	// {
	// 	href: '/messages',
	// 	Icon: MessageSquare,
	// 	label: 'Messages',
	// 	comingSoon: true,
	// 	loginRequired: true
	// },
	// {
	// 	href: '/community',
	// 	Icon: Users2,
	// 	label: 'Community',
	// 	comingSoon: true,
	// 	loginRequired: true
	// },
	// {
	// 	href: '/forum',
	// 	Icon: MessageCircle,
	// 	label: 'Forum',
	// 	comingSoon: true,
	// 	loginRequired: true
	// },
	// {
	// 	href: '/profile',
	// 	Icon: User,
	// 	label: 'Profile',
	// 	comingSoon: true,
	// 	loginRequired: true
	// },
	// {
	// 	href: '/settings',
	// 	Icon: Settings,
	// 	label: 'Settings',
	// 	comingSoon: true,
	// 	loginRequired: true
	// }
];

export const MENU_ITEMS_WITH_PERMISSION: MenuItem[] = [
	{
		href: '/mentor',
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
		href: '/mentor/pr-reviews',
		Icon: GitPullRequest,
		label: 'PR Reviews',
		orgPermission: {
			permission: 'org:project:create',
			role: 'org:admin'
		}
	}
];
