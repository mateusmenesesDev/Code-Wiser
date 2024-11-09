'use client';

import {
	Calendar,
	FileText,
	Layers,
	LayoutDashboard,
	ListTodo,
	Settings,
	Timer,
	Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '~/common/components/button';
import { ScrollArea } from '~/common/components/scroll-area';
import { cn } from '~/lib/utils';
import { ProjectHeader } from './ProjectHeader';

const sidebarNavItems = [
	{
		title: 'Overview',
		href: '/projects/[id]',
		icon: LayoutDashboard,
		comingSoon: true
	},
	{
		title: 'Board',
		href: '/projects/[id]/board',
		icon: ListTodo
	},
	{
		title: 'Timeline',
		href: '/projects/[id]/timeline',
		icon: Calendar,
		comingSoon: true
	},
	{
		title: 'Backlog',
		href: '/projects/[id]/backlog',
		icon: Timer,
		methodologies: ['scrum']
	},
	{
		title: 'Epics',
		href: '/projects/[id]/epics',
		icon: Layers,
		methodologies: ['scrum']
	},
	{
		title: 'Team',
		href: '/projects/[id]/team',
		icon: Users,
		comingSoon: true
	},
	{
		title: 'Resources',
		href: '/projects/[id]/resources',
		icon: FileText,
		comingSoon: true
	},
	{
		title: 'Settings',
		href: '/projects/[id]/settings',
		icon: Settings,
		comingSoon: true
	}
];

interface ProjectLayoutProps {
	children: React.ReactNode;
	projectId: string;
	methodology: 'kanban' | 'scrum';
}

export function ProjectLayout({
	children,
	projectId,
	methodology
}: ProjectLayoutProps) {
	const pathname = usePathname();

	return (
		<div className="flex h-screen overflow-hidden">
			{/* Sidebar */}
			<div className="w-64 flex-shrink-0 border-r bg-muted/30">
				<div className="flex h-14 items-center border-b px-4">
					<Link href="/projects" className="font-semibold">
						Projects
					</Link>
				</div>
				<ScrollArea className="h-[calc(100vh-3.5rem)] px-2 py-4">
					<nav className="space-y-1">
						{sidebarNavItems
							.filter(
								(item) =>
									!item.methodologies ||
									item.methodologies.includes(methodology)
							)
							.map((item) => {
								const isActive = pathname.startsWith(
									item.href.replace('[id]', projectId)
								);
								return (
									<>
										{!item.comingSoon ? (
											<Button
												key={item.href}
												variant={isActive ? 'secondary' : 'ghost'}
												className={cn(
													'w-full justify-start',
													isActive && 'bg-muted'
												)}
												asChild
											>
												<Link
													href={item.href.replace('[id]', projectId)}
													className="flex items-center"
												>
													<item.icon className="mr-2 h-4 w-4" />
													{item.title}
												</Link>
											</Button>
										) : (
											<div
												key={item.href}
												className="w-full justify-start bg-muted p-2"
											>
												<div className="flex items-center">
													<item.icon className="mr-2 h-4 w-4" />
													<span className="text-gray-500">
														{item.title} (Coming Soon)
													</span>
												</div>
											</div>
										)}
									</>
								);
							})}
					</nav>
				</ScrollArea>
			</div>

			{/* Main Content */}
			<div className="flex flex-1 flex-col overflow-hidden">
				<ProjectHeader projectId={projectId} />
				<main className="flex-1 overflow-auto">{children}</main>
			</div>
		</div>
	);
}
