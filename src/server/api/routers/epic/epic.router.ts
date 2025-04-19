import { createTRPCRouter } from '../../trpc';
import { epicMutations } from './mutations/epic.mutation';
import { epicQueries } from './queries/epic.query';

export const epicRouter = createTRPCRouter({
	...epicMutations,
	...epicQueries
});
