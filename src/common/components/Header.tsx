import { UserButton } from '@clerk/nextjs';
import { Bell } from 'lucide-react';
import { ToggleTheme } from './ToggleTheme';
import { Button } from './button';

export default function Header() {
	return (
		<header className="bg-card text-card-foreground shadow">
			<div className="flex items-center justify-between px-4 py-4">
				<h1 className="font-semibold text-2xl text-primary">
					{'<CodeWise />'}
				</h1>
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
