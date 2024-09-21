import Dashboard from '~/features/dashboard/Dashboard';
import { HydrateClient } from '~/trpc/server';

export default async function Home() {
	return (
		<HydrateClient>
			<main>
				<Dashboard />
			</main>
		</HydrateClient>
	);
}
