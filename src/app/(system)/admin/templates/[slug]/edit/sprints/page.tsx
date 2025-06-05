import { SprintPlanning } from '~/features/workspace/components/sprint/SprintPlanning';
import { api } from '~/trpc/server';

export default async function SprintsPage({
	params
}: { params: { slug: string } }) {
	const sprints = await api.sprint.getAllByProjectTemplateSlug({
		projectTemplateSlug: params.slug
	});

	return <SprintPlanning sprints={sprints} />;
}
