import type { LucideIcon } from 'lucide-react';
import { ChevronDown, CreditCard, FolderOpen, LogIn, User } from 'lucide-react';
import Link from 'next/link';
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from '~/common/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/common/components/ui/dropdown-menu';

import { Protect } from '@clerk/nextjs';
import { Button } from '~/common/components/ui/button';
import { MENU_ITEMS_WITH_PERMISSION } from '~/common/constants/menuItem';
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
							<User className="h-4 w-4" />
						</AvatarFallback>
					</Avatar>
					<span className="hidden font-medium text-sm sm:block">
						{user?.fullName}
					</span>
					<ChevronDown className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48 border bg-background">
				<DropdownMenuItem asChild className="cursor-pointer">
					<Link href="/my-projects" className="flex items-center gap-2">
						<FolderOpen className="h-4 w-4" />
						My Projects
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild disabled className="cursor-pointer">
					<Link href="/upgrade" className="flex items-center gap-2">
						<CreditCard className="h-4 w-4" />
						Upgrade (Coming Soon)
					</Link>
				</DropdownMenuItem>
				{MENU_ITEMS_WITH_PERMISSION.map((Item) => {
					const Icon = Item.Icon as LucideIcon;
					return (
						Item.orgPermission && (
							<Protect
								key={Item.href}
								permission={Item.orgPermission.permission}
							>
								<DropdownMenuItem
									asChild
									disabled={Item.disabled}
									className="cursor-pointer"
								>
									<Link href={Item.href} className="flex items-center gap-2">
										<Icon className="h-4 w-4" />
										{Item.label}
									</Link>
								</DropdownMenuItem>
							</Protect>
						)
					);
				})}
				<DropdownMenuItem
					onClick={signOut}
					className="flex items-center gap-2 text-red-600 dark:text-red-400"
				>
					<LogIn className="h-4 w-4 rotate-180" />
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
