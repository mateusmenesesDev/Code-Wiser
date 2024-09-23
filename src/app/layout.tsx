import '~/styles/globals.css';

import { ClerkProvider } from '@clerk/nextjs';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { GeistSans } from 'geist/font/sans';
import { ThemeProvider } from '~/providers/ThemeProvider';
import { TRPCReactProvider } from '~/trpc/react';

dayjs.extend(localizedFormat);

export default function RootLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<ClerkProvider>
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
