import { createTRPCRouter } from '../../trpc';
import { prReviewMutations } from './mutations/prReview.mutations';
import { prReviewQueries } from './queries/prReview.queries';

export const prReviewRouter = createTRPCRouter({
	...prReviewQueries,
	...prReviewMutations
});

