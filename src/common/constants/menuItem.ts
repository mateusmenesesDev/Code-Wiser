import { FolderOpen, Settings, Users } from 'lucide-react';

type MenuItem = {
	href: string;
	icon: React.ElementType;
	label: string;
	comingSoon?: boolean;
	loginRequired?: boolean;
	orgPermission?: ClerkAuthorization;
	disabled?: boolean;
};

export const MENU_ITEMS: MenuItem[] = [
	// {
	// 	href: '/',
	// 	icon: Layout,
	// 	label: 'Dashboard',
	// 	comingSoon: true,
	// 	loginRequired: true
	// },
	{
		href: '/my-projects',
		icon: FolderOpen,
		label: 'My Projects',
		loginRequired: true
	}
	// {
	// 	href: '/mentors',
	// 	icon: Users,
	// 	label: 'Mentors',
	// 	comingSoon: true,
	// 	loginRequired: true
	// },
	// {
	// 	href: '/messages',
	// 	icon: MessageSquare,
	// 	label: 'Messages',
	// 	comingSoon: true,
	// 	loginRequired: true
	// },
	// {
	// 	href: '/community',
	// 	icon: Users2,
	// 	label: 'Community',
	// 	comingSoon: true,
	// 	loginRequired: true
	// },
	// {
	// 	href: '/forum',
	// 	icon: MessageCircle,
	// 	label: 'Forum',
	// 	comingSoon: true,
	// 	loginRequired: true
	// },
	// {
	// 	href: '/profile',
	// 	icon: User,
	// 	label: 'Profile',
	// 	comingSoon: true,
	// 	loginRequired: true
	// },
	// {
	// 	href: '/settings',
	// 	icon: Settings,
	// 	label: 'Settings',
	// 	comingSoon: true,
	// 	loginRequired: true
	// }
];

export const MENU_ITEMS_WITH_PERMISSION: MenuItem[] = [
	{
		href: '/admin/templates',
		icon: Settings,
		label: 'Admin Projects',
		orgPermission: {
			permission: 'org:project:edit_template',
			role: 'org:admin'
		},
		loginRequired: true
	},
	{
		href: '/admin/mentorship',
		icon: Users,
		label: 'Admin Mentorship',
		orgPermission: {
			permission: 'org:project:edit_template',
			role: 'org:admin'
		},
		loginRequired: true,
		disabled: true
	}
];
