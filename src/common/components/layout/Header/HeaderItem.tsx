import { Protect } from '@clerk/nextjs';
import Link from 'next/link';
import type { MENU_ITEMS } from '~/common/constants/menuItem';

export const MenuItem = ({ item }: { item: (typeof MENU_ITEMS)[number] }) => {
	return (
		<Link
			key={item.href}
			href={item.href}
			className="group flex items-center gap-2 font-medium text-muted-foreground transition-colors hover:text-dev-blue-600"
		>
			<item.icon className="h-4 w-4" />
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

	return (
		<Protect key={item.href} permission={item.orgPermission?.permission}>
			<MenuItem item={item} />
		</Protect>
	);
};
