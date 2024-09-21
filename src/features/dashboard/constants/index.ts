import { Briefcase, Clock, Users } from 'lucide-react';
import type { DashboardCardProps } from '../components/DashboardCard';

export const dashboardCards: DashboardCardProps[] = [
	{
		title: 'Total Projects',
		value: '12',
		description: 'Active projects this month',
		icon: Briefcase,
		iconColor: 'text-accent'
	},
	{
		title: 'Hours Logged',
		value: '164',
		description: 'Hours worked this month',
		icon: Clock,
		iconColor: 'text-accent'
	},
	{
		title: 'Mentorship Sessions',
		value: '8',
		description: 'Sessions completed this month',
		icon: Users,
		iconColor: 'text-accent'
	}
];
