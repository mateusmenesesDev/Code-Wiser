'use client';

import { UserButton } from '@clerk/nextjs';
import { Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ToggleTheme } from '../components/ToggleTheme';
import { Button } from '../components/button';

export default function Header() {
	const pathname = usePathname();

	const isDashboard = pathname === '/';
	const headerTitle = isDashboard ? 'Dashboard' : pathname.split('/')[1];
	return (
		<header className="bg-card text-card-foreground shadow">
			<div className="flex items-center justify-between p-4">
				<h1 className="font-semibold text-2xl capitalize">{headerTitle}</h1>
				<div className="flex items-center space-x-4">
					<ToggleTheme />
					<Button variant="ghost" size="icon">
						<Bell className="h-5 w-5 text-primary" />
					</Button>
					<UserButton />
				</div>
			</div>
		</header>
	);
}
