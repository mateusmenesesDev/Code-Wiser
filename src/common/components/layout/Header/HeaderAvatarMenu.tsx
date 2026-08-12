import { ChevronDown, LogIn, User } from 'lucide-react';
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
					<ChevronDown className="h-4 w-4" aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48 border bg-background">
				<DropdownMenuLabel>{user?.fullName ?? 'Account'}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={signOut}
					className="flex cursor-pointer items-center gap-2 text-destructive"
				>
					<LogIn className="h-4 w-4 rotate-180" aria-hidden="true" />
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
