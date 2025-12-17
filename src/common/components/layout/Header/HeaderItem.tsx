import { Protect } from '@clerk/nextjs';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { MENU_ITEMS } from '~/common/constants/menuItem';

export const MenuItem = ({ item }: { item: (typeof MENU_ITEMS)[number] }) => {
	const Icon = item.Icon as LucideIcon;
	return (
		<Link
			key={item.href}
			href={item.href}
			className="flex items-center gap-2 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
		>
			<Icon className="h-4 w-4" />
			{item.label}
		</Link>
	);
};

export const ProtectedMenuItem = ({
	item
}: { item: (typeof MENU_ITEMS)[number] }) => {
	if (!item.orgPermission) {
		return <MenuItem item={item} />;
	}

	const role = item.orgPermission.role;

	return (
		<Protect key={item.href} role={role}>
			<MenuItem item={item} />
		</Protect>
	);
};
