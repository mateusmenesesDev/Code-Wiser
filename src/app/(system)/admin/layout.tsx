import '~/styles/globals.css';

import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
	title: {
		template: '%s | CodeWise - Admin Panel',
		default: 'CodeWise - Admin Panel'
	},
	description: 'CodeWise - Admin Panel',
	icons: [{ rel: 'icon', url: '/favicon.svg' }]
};

export default function RootLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	const { has } = auth();
	if (!has({ role: 'org:admin' })) {
		return redirect('/');
	}
	return <>{children}</>;
}
