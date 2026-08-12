import '~/styles/globals.css';

import type { Metadata } from 'next';
import { requireAdminAccess } from '~/server/auth/requireAdminPermission';

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
	requireAdminAccess();
	return <>{children}</>;
}
