import Header from '~/common/components/layout/Header';
import '~/styles/globals.css';
import { HydrateClient } from '~/trpc/server';

export default function Layout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<HydrateClient>
			<div className="bg-background text-foreground">
				<Header />
				<main className="p-6">{children}</main>
			</div>
		</HydrateClient>
	);
}
