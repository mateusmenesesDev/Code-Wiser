import {
	BookOpen,
	Layout,
	MessageCircle,
	MessageSquare,
	Settings,
	User,
	Users,
	Users2
} from 'lucide-react';

export const MENU_ITEMS = [
	{ href: '/', icon: Layout, label: 'Dashboard' },
	{ href: '/projects', icon: BookOpen, label: 'Projects' },
	{ href: '/mentors', icon: Users, label: 'Mentors', comingSoon: true },
	{
		href: '/messages',
		icon: MessageSquare,
		label: 'Messages',
		comingSoon: true
	},
	{ href: '/community', icon: Users2, label: 'Community', comingSoon: true },
	{ href: '/forum', icon: MessageCircle, label: 'Forum', comingSoon: true },
	{ href: '/profile', icon: User, label: 'Profile', comingSoon: true },
	{ href: '/settings', icon: Settings, label: 'Settings', comingSoon: true }
];
