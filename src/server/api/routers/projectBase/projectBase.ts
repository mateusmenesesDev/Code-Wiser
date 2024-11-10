import { createTRPCRouter } from '~/server/api/trpc';
import { projectBaseMutations } from './mutations/projectBaseMutations';
import { projectBaseQueries } from './queries/projectBaseQueries';

export const projectBaseRouter = createTRPCRouter({
	...projectBaseQueries,
	...projectBaseMutations
});
