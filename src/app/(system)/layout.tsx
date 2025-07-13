import Header from '~/common/components/layout/Header';
import '~/styles/globals.css';
import { HydrateClient } from '~/trpc/server';

export default function Layout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<HydrateClient>
			<div className="flex h-screen bg-background text-foreground">
				<div className="flex-1 overflow-y-auto">
					<Header />
					<main className="p-6">{children}</main>
				</div>
			</div>
		</HydrateClient>
	);
}
