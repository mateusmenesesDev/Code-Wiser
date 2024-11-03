'use client';

import { Protect } from '@clerk/nextjs';
import { Code, CreditCard, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '~/common/components/badge';
import { MENU_ITEMS } from '~/common/constants/menuItem';
import { Button } from '../components/button';
import { Sheet, SheetContent, SheetTrigger } from '../components/sheet';

type SidebarProps = {
	className?: string;
};
const LinkItem = (item: (typeof MENU_ITEMS)[0], pathname: string) => {
	return (
		<Link
			key={item.href}
			href={item.href}
			className={`flex items-center px-4 py-2 ${
				pathname === item.href
					? 'bg-primary/10 text-primary'
					: item.comingSoon
						? 'cursor-not-allowed text-muted-foreground'
						: 'text-foreground hover:bg-accent hover:text-accent-foreground'
			}`}
			onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
		>
			<item.icon className="mr-3 h-5 w-5" />
			{item.label}
			{item.comingSoon && (
				<Badge variant="outline" className="ml-auto text-xs">
					Coming Soon
				</Badge>
			)}
		</Link>
	);
};

export default function Sidebar({ className }: SidebarProps) {
	const pathname = usePathname();
	const userCredits = 100;
	const SidebarContent = () => (
		<div className="flex h-full flex-col shadow dark:shadow-primary/10">
			<div className="p-4">
				<Link
					href="/"
					className="flex items-center space-x-2 font-bold text-primary text-xl"
				>
					<Code />
					<span>CodeWise</span>
				</Link>
			</div>
			<nav className="mt-4 flex-1">
				{MENU_ITEMS.map((item) =>
					!item.orgPermission ? (
						LinkItem(item, pathname)
					) : (
						<Protect key={item.href} permission={item.orgPermission}>
							{LinkItem(item, pathname)}
						</Protect>
					)
				)}
			</nav>
			<div className="mt-auto border-border border-t p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2 font-semibold text-primary text-sm">
						<CreditCard className="h-4 w-4" />
						<span>Credits: {userCredits}</span>
					</div>
					<Link href="/buy-credits">
						<Button variant="default" size="sm">
							Buy More
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);

	return (
		<>
			<div className="shadow-md md:shadow-none">
				<Sheet>
					<SheetTrigger asChild>
						<Button variant="ghost" size="icon" className="mt-4 md:hidden">
							<Menu className="h-5 w-5" />
							<span className="sr-only">Toggle sidebar</span>
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="w-64 p-0">
						<SidebarContent />
					</SheetContent>
				</Sheet>
			</div>
			<div className={`hidden w-64 pt-2 md:block ${className}`}>
				<SidebarContent />
			</div>
		</>
	);
}
