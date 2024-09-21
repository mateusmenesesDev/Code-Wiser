import type { LucideIcon } from 'lucide-react';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/card';

export type DashboardCardProps = {
	title: string;
	value: string | number;
	description: string;
	icon: LucideIcon;
	iconColor: string;
};

export function DashboardCard({
	title,
	value,
	description,
	icon: Icon,
	iconColor
}: DashboardCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-muted-foreground text-sm">
					{title}
				</CardTitle>
				<Icon className={`h-4 w-4 ${iconColor}`} />
			</CardHeader>
			<CardContent>
				<div className="font-bold text-2xl text-foreground">{value}</div>
				<p className="text-muted-foreground text-xs">{description}</p>
			</CardContent>
		</Card>
	);
}
