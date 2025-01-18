import { auth } from '@clerk/nextjs/server';
import Header from '~/common/components/layout/Header';
import Sidebar from '~/common/components/layout/SideBar';
import '~/styles/globals.css';

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
