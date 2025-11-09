'use client';

import { useTheme } from 'next-themes';
import Link from 'next/link';

import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';

import { LogIn, Moon, Sparkles, Sun } from 'lucide-react';
import { Switch } from '~/common/components/ui/switch';
import {
	MENU_ITEMS,
	MENU_ITEMS_WITH_PERMISSION
} from '~/common/constants/menuItem';
import { useDialog } from '~/common/hooks/useDialog';
import SignInDialog from '~/features/auth/components/Signin/SigninDialog';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { api } from '~/trpc/react';
import CodeWiseIcon from '../../icons/CodeWiseIcon';
import HeaderAvatarMenu from './HeaderAvatarMenu';
import { MenuItem, ProtectedMenuItem } from './HeaderItem';

const Header = () => {
	const { openDialog } = useDialog('signIn');
	const { theme, setTheme } = useTheme();
	const { user } = useAuth();
	const isLoggedIn = !!user;
	const { data: userCredits } = api.user.getCredits.useQuery(undefined, {
		enabled: isLoggedIn
	});

	const allMenuItems = [...MENU_ITEMS, ...MENU_ITEMS_WITH_PERMISSION];

	return (
		<header className="border-b bg-background/80 backdrop-blur-md">
			<div className="container mx-auto py-2">
				<div className="flex items-center justify-between">
					<Link href="/">
						<CodeWiseIcon />
					</Link>

					{/* Navigation */}
					<nav className="hidden items-center gap-8 md:flex">
						{isLoggedIn &&
							allMenuItems.map((item) =>
								!item.orgPermission ? (
									<MenuItem key={item.href} item={item} />
								) : (
									<ProtectedMenuItem key={item.href} item={item} />
								)
							)}
					</nav>

					{/* Right Section */}
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<Sun className="h-4 w-4" />
							<Switch
								checked={theme === 'dark'}
								onCheckedChange={() =>
									setTheme(theme === 'dark' ? 'light' : 'dark')
								}
							/>
							<Moon className="h-4 w-4" />
						</div>

						{isLoggedIn ? (
							<>
								{/* Credits Badge */}
								<Badge variant="purple-gradient">
									<Sparkles className="mr-1 h-3 w-3" />
									{userCredits?.credits ?? 0} credits
								</Badge>

								{/* User Menu */}
								<HeaderAvatarMenu />
							</>
						) : (
							<div className="flex items-center gap-3">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => openDialog('signIn')}
								>
									<LogIn className="mr-2 h-4 w-4" />
									Sign In
								</Button>
								<Button
									onClick={() => openDialog('signUp')}
									size="sm"
									className="bg-gradient-to-r from-dev-blue-600 to-dev-purple-600 hover:from-dev-blue-700 hover:to-dev-purple-700"
								>
									Get Started
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>

			<SignInDialog />
		</header>
	);
};

export default Header;
