'use client';

import { Code } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '~/common/components/badge';
import { menuItems } from '~/common/constants/menuItem';

export default function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="h-screen w-64 bg-card text-card-foreground shadow-md dark:shadow-primary/20">
			<div className="p-4">
				<Link
					href="/"
					className="flex items-center space-x-2 font-bold text-primary text-xl"
				>
					<Code />
					<span>CodeWise</span>
				</Link>
			</div>
			<nav className="mt-8">
				{menuItems.map((item) => (
					<Link
						key={item.href}
						href={item.comingSoon ? '#' : item.href}
						aria-disabled={item.comingSoon}
						className={`flex items-center px-4 py-2 ${
							pathname === item.href
								? 'bg-primary/10 text-primary'
								: item.comingSoon
									? 'cursor-not-allowed text-muted-foreground'
									: 'text-foreground hover:bg-accent hover:text-accent-foreground'
						}`}
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
		</aside>
	);
}
