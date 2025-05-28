import { createTRPCRouter } from '../../trpc';
import { kanbanMutations } from './mutations/kanbanMutations';
import { kanbanQueries } from './queries/kanbanQueries';

export const kanbanRouter = createTRPCRouter({
	...kanbanQueries,
	...kanbanMutations
});
