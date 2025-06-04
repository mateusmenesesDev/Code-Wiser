import Projects from '~/features/projects/components/Projects';
import { HydrateClient } from '~/trpc/server';

export default async function Home() {
	return (
		<HydrateClient>
			<main>
				<Projects />
			</main>
		</HydrateClient>
	);
}
