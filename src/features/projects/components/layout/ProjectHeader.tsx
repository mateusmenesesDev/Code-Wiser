'use client';

import { MoreHorizontal, Plus, Search, Star } from 'lucide-react';
import { Button } from '~/common/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/common/components/ui/dropdown-menu';
import { Input } from '~/common/components/ui/input';

export function ProjectHeader() {
	return (
		<header className="flex h-14 items-center justify-between border-b px-6">
			<div className="flex items-center space-x-4">
				<div className="flex items-center space-x-2">
					<h1 className="font-semibold text-xl">Project Name</h1>
					<Button variant="ghost" size="icon">
						<Star className="h-4 w-4" />
					</Button>
				</div>
				<div className="relative w-64">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search..." className="pl-9" />
				</div>
			</div>
			<div className="flex items-center space-x-2">
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Create
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem>Project settings</DropdownMenuItem>
						<DropdownMenuItem>Manage access</DropdownMenuItem>
						<DropdownMenuItem className="text-destructive">
							Delete project
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
