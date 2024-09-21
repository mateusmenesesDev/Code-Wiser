import {
	BookOpen,
	Layout,
	MessageSquare,
	Settings,
	User,
	Users
} from 'lucide-react';

export const menuItems = [
	{ href: '/', icon: Layout, label: 'Dashboard' },
	{ href: '/projects', icon: BookOpen, label: 'Projects' },
	{ href: '/mentors', icon: Users, label: 'Mentors', comingSoon: true },
	{
		href: '/messages',
		icon: MessageSquare,
		label: 'Messages',
		comingSoon: true
	},
	{ href: '/profile', icon: User, label: 'Profile', comingSoon: true },
	{ href: '/settings', icon: Settings, label: 'Settings', comingSoon: true }
];
