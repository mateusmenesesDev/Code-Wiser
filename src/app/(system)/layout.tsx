import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import Header from '~/common/layout/Header';
import Sidebar from '~/common/layout/SideBar';
import '~/styles/globals.css';

export const metadata: Metadata = {
	title: {
		template: '%s | Code Wise',
		default: 'Code Wise'
	},
	description:
		'Code Wise - The best way to learn how to code with senior developers',
	icons: [{ rel: 'icon', url: '/favicon.ico' }]
};

export default function Layout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	auth().protect({
		unauthenticatedUrl: '/login',
		unauthorizedUrl: '/'
	});

	return (
		<div className="flex h-screen bg-background text-foreground">
			<Sidebar />
			<div className="flex-1 overflow-y-auto">
				<Header />
				<main className="p-6">{children}</main>
			</div>
		</div>
	);
}
