import '~/styles/globals.css';

import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { GeistSans } from 'geist/font/sans';
import { SyncActiveOrganization } from '~/features/auth/components/SyncActiveOrganizations';
import { ThemeProvider } from '~/providers/ThemeProvider';
import { TRPCReactProvider } from '~/trpc/react';

dayjs.extend(localizedFormat);

export default function RootLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	const { sessionClaims } = auth();
	console.log(sessionClaims);
	return (
		<ClerkProvider>
			<SyncActiveOrganization membership={sessionClaims?.membership} />
			<html lang="pt-BR" className={`${GeistSans.variable}`}>
				<body>
					<TRPCReactProvider>
						<ThemeProvider
							attribute="class"
							defaultTheme="light"
							enableSystem
							disableTransitionOnChange
						>
							{children}
						</ThemeProvider>
					</TRPCReactProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
