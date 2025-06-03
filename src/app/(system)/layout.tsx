import Header from '~/common/components/layout/Header';
import '~/styles/globals.css';

export default function Layout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="flex h-screen bg-background text-foreground">
			<div className="flex-1 overflow-y-auto">
				<Header />
				<main className="p-6">{children}</main>
			</div>
		</div>
	);
}
