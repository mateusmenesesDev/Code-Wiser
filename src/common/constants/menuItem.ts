import { BookOpen, Briefcase } from 'lucide-react';

type MenuItem = {
	href: string;
	icon: React.ElementType;
	label: string;
	comingSoon?: boolean;
	loginRequired?: boolean;
	orgPermission?: ClerkAuthorization;
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
		href: '/projects',
		icon: BookOpen,
		label: 'Projects',
		loginRequired: false
	},
	// {
	// 	href: '/my-projects',
	// 	icon: FolderOpen,
	// 	label: 'My Projects',
	// 	loginRequired: true
	// },
	{
		href: '/projects/templates',
		icon: Briefcase,
		label: 'Projects Template',
		orgPermission: {
			permission: 'org:project:edit_template',
			role: 'org:admin'
		},
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
