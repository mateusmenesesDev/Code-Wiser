import '~/styles/globals.css';

import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { GeistSans } from 'geist/font/sans';
import { Provider as JotaiProvider } from 'jotai';
import type { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';
import Header from '~/common/components/layout/Header';
import { SyncActiveOrganization } from '~/features/auth/components/SyncActiveOrganizations';
import { ThemeProvider } from '~/providers/ThemeProvider';
import { TRPCReactProvider } from '~/trpc/react';
import { HydrateClient } from '~/trpc/server';

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(isSameOrAfter);

export const metadata: Metadata = {
	title: {
		template: '%s | CodeWise - Mentorship & Project-Based Learning Platform',
		default: 'CodeWise - Learn Software Development Through Real Projects'
	},
	description:
		'Accelerate your software development career with CodeWise. Get personalized mentorship from senior developers, work on real-world projects, and master coding through hands-on experience.',
	icons: [{ rel: 'icon', url: '/favicon.svg' }]
};

export default function RootLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	const { sessionClaims } = auth();
	return (
		<ClerkProvider>
			<JotaiProvider>
				<SyncActiveOrganization membership={sessionClaims?.membership} />
				<html
					lang="pt-BR"
					className={`${GeistSans.variable}`}
					suppressHydrationWarning
				>
					<body>
						<TRPCReactProvider>
							<NuqsAdapter>
								<ThemeProvider
									attribute="class"
									defaultTheme="light"
									enableSystem
									disableTransitionOnChange
								>
									<HydrateClient>
										<Header />
										<main className="p-6">{children}</main>
									</HydrateClient>
									<Toaster richColors />
								</ThemeProvider>
							</NuqsAdapter>
						</TRPCReactProvider>
					</body>
				</html>
			</JotaiProvider>
		</ClerkProvider>
	);
}
