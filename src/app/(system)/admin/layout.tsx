import '~/styles/globals.css';

import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

type OrganizationData = {
	id: string;
	rol: string;
	slg: string;
};

export const metadata: Metadata = {
	title: {
		template: '%s | CodeWise - Admin Panel',
		default: 'CodeWise - Admin Panel'
	},
	description: 'CodeWise - Admin Panel',
	icons: [{ rel: 'icon', url: '/favicon.svg' }]
};

export default function Layout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	const session = auth();

	const orgRole = (session.sessionClaims?.o as OrganizationData)?.rol;

	const isAdmin = orgRole === 'admin' || session.has({ role: 'org:admin' });

	if (!isAdmin) {
		return redirect('/');
	}

	return <>{children}</>;
}
