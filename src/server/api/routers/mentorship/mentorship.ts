import { mentorshipQueries } from './mentorship.queries';
import { mentorshipMutations } from './mentorship.mutations';
import { createTRPCRouter } from '~/server/api/trpc';

export const mentorshipRouter = createTRPCRouter({
	...mentorshipQueries,
	...mentorshipMutations
});
