import '~/styles/globals.css';

import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
	title: 'Code Wise - Login',
	description: 'Generated by create-t3-app',
	icons: [{ rel: 'icon', url: '/favicon.ico' }]
};

export default function Layout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	const { userId } = auth();
	if (userId) {
		redirect('/');
	}

	return <>{children}</>;
}
