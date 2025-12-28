import { createTRPCRouter } from '~/server/api/trpc';
import { mentorshipMutations } from './mentorship.mutations';
import { mentorshipQueries } from './mentorship.queries';

export const mentorshipRouter = createTRPCRouter({
	...mentorshipQueries,
	...mentorshipMutations
});
