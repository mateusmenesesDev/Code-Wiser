import { createTRPCRouter } from '../../trpc';
import { projectMutations } from './mutations/projectMutations';
import { getProjectQueries } from './queries/getProjectQueries';

export const projectRouter = createTRPCRouter({
	...getProjectQueries,
	...projectMutations
});
