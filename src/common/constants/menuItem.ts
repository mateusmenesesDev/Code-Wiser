import { FolderOpen, Settings, Users } from 'lucide-react';

type MenuItem = {
	href: string;
	Icon: React.ElementType;
	label: string;
	comingSoon?: boolean;
	loginRequired?: boolean;
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
		href: '/admin/templates',
		Icon: Settings,
		label: 'Admin Projects',
		orgPermission: {
			permission: 'org:project:edit_template',
			role: 'org:admin'
		},
		loginRequired: true
	},
	{
		href: '/admin/mentorship',
		Icon: Users,
		label: 'Admin Mentorship',
		orgPermission: {
			permission: 'org:project:edit_template',
			role: 'org:admin'
		},
		loginRequired: true,
		disabled: true
	}
];
