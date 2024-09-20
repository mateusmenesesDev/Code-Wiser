import { HydrateClient } from '~/trpc/server';

export default async function Home() {
	return (
		<HydrateClient>
			<main>
				<h1>Code Wise</h1>
			</main>
		</HydrateClient>
	);
}
