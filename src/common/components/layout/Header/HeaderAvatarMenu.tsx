import { useClerk, useAuth as useClerkAuth, useSignIn } from '@clerk/nextjs';
import { ChevronDown, LogIn, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from '~/common/components/ui/avatar';
import { Button } from '~/common/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/common/components/ui/dropdown-menu';
import { useAuth } from '~/features/auth/hooks/useAuth';

export default function HeaderAvatarMenu() {
	const { user, signOut } = useAuth();
	const { actor } = useClerkAuth();
	const { setActive } = useClerk();
	const { isLoaded: isSignInLoaded, signIn } = useSignIn();
	const [isReturningToAdmin, setIsReturningToAdmin] = useState(false);

	const returnToAdmin = async () => {
		const adminSessionId = sessionStorage.getItem(
			'code-wiser:admin-session-id'
		);
		const adminSignInToken = sessionStorage.getItem(
			'code-wiser:admin-session-token'
		);

		if (!adminSessionId && !adminSignInToken) {
			toast.error('The original admin session is no longer available');
			return;
		}

		setIsReturningToAdmin(true);
		try {
			let restored = false;
			if (adminSessionId) {
				try {
					await setActive({ session: adminSessionId });
					restored = true;
				} catch {
					// Fall back to the short-lived recovery ticket when the old session expired.
				}
			}

			if (!restored) {
				if (!adminSignInToken || !isSignInLoaded) {
					throw new Error('Admin recovery session is not ready');
				}

				const { createdSessionId } = await signIn.create({
					strategy: 'ticket',
					ticket: adminSignInToken
				});

				if (!createdSessionId) {
					throw new Error('Clerk did not create the admin recovery session');
				}

				await setActive({ session: createdSessionId });
			}

			sessionStorage.removeItem('code-wiser:admin-session-id');
			sessionStorage.removeItem('code-wiser:admin-session-token');
			window.location.assign('/');
		} catch {
			setIsReturningToAdmin(false);
			toast.error('Could not restore the original admin session');
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="flex items-center gap-2 p-2">
					<Avatar className="h-8 w-8">
						<AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ''} />
						<AvatarFallback>
							<User className="h-4 w-4" aria-hidden="true" />
						</AvatarFallback>
					</Avatar>
					<span className="hidden font-medium text-sm sm:block">
						{user?.fullName}
					</span>
					{actor && (
						<span className="hidden rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-900 text-xs md:inline">
							Impersonating
						</span>
					)}
					<ChevronDown className="h-4 w-4" aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48 border bg-background">
				<DropdownMenuLabel>{user?.fullName ?? 'Account'}</DropdownMenuLabel>
				{actor && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => void returnToAdmin()}
							disabled={isReturningToAdmin}
							className="flex cursor-pointer items-center gap-2"
						>
							<LogIn className="h-4 w-4" aria-hidden="true" />
							Return to admin
						</DropdownMenuItem>
					</>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => {
						sessionStorage.removeItem('code-wiser:admin-session-id');
						sessionStorage.removeItem('code-wiser:admin-session-token');
						void signOut();
					}}
					className="flex cursor-pointer items-center gap-2 text-destructive"
				>
					<LogIn className="h-4 w-4 rotate-180" aria-hidden="true" />
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
