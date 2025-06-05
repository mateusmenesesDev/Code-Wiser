'use client';

import { useTheme } from 'next-themes';
import Link from 'next/link';

import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';

import { LogIn, Moon, Sparkles, Sun } from 'lucide-react';
import { Switch } from '~/common/components/ui/switch';
import { MENU_ITEMS } from '~/common/constants/menuItem';
import { useDialog } from '~/common/hooks/useDialog';
import SignInDialog from '~/features/auth/components/Signin/SigninDialog';
import SignUpDialog from '~/features/auth/components/Signup/SignupDialog';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { api } from '~/trpc/react';
import CodeWiseIcon from '../../icons/CodeWiseIcon';
import HeaderAvatarMenu from './HeaderAvatarMenu';
import { MenuItem, ProtectedMenuItem } from './HeaderItem';

const Header = () => {
	const { openDialog } = useDialog('signIn');
	const { theme, setTheme } = useTheme();
	const { user } = useAuth();
	const { data: userCredits } = api.user.getCredits.useQuery();

	const isLoggedIn = !!user;

	return (
		<header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
			<div className="container mx-auto py-2">
				<div className="flex items-center justify-between">
					<Link href="/">
						<CodeWiseIcon />
					</Link>

					{/* Navigation */}
					<nav className="hidden items-center gap-8 md:flex">
						{isLoggedIn &&
							MENU_ITEMS.map((item) =>
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
								<Badge
									variant="outline"
									className="border-dev-purple-200 bg-gradient-to-r from-dev-purple-50 to-dev-blue-50 text-dev-purple-700 dark:border-dev-purple-700 dark:from-dev-purple-900/20 dark:to-dev-blue-900/20 dark:text-dev-purple-300"
								>
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
			<SignUpDialog />
		</header>
	);
};

export default Header;
