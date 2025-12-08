import { createTRPCRouter } from '../../trpc';
import { planningPokerMutations } from './mutations/planningPoker.mutations';
import { planningPokerQueries } from './queries/planningPoker.queries';

export const planningPokerRouter = createTRPCRouter({
	...planningPokerQueries,
	...planningPokerMutations
});
