'use client';

import { Code, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '~/common/components/badge';
import { menuItems } from '~/common/constants/menuItem';
import { Button } from '../components/button';
import { Sheet, SheetContent, SheetTrigger } from '../components/sheet';

type SidebarProps = {
	className?: string;
};

export default function Sidebar({ className }: SidebarProps) {
	const pathname = usePathname();

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
				{menuItems.map((item) => (
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
				))}
			</nav>
		</div>
	);

	return (
		<>
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

			<div className={`hidden w-64 pt-2 md:block ${className}`}>
				<SidebarContent />
			</div>
		</>
	);
}
