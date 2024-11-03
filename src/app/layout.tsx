import '~/styles/globals.css';

import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { GeistSans } from 'geist/font/sans';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';
import { SyncActiveOrganization } from '~/features/auth/components/SyncActiveOrganizations';
import { ThemeProvider } from '~/providers/ThemeProvider';
import { TRPCReactProvider } from '~/trpc/react';

dayjs.extend(localizedFormat);

export default function RootLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	const { sessionClaims } = auth();
	return (
		<ClerkProvider>
			<SyncActiveOrganization membership={sessionClaims?.membership} />
			<html lang="pt-BR" className={`${GeistSans.variable}`}>
				<body>
					<TRPCReactProvider>
						<NuqsAdapter>
							<ThemeProvider
								attribute="class"
								defaultTheme="light"
								enableSystem
								disableTransitionOnChange
							>
								{children}
								<Toaster richColors />
							</ThemeProvider>
						</NuqsAdapter>
					</TRPCReactProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
