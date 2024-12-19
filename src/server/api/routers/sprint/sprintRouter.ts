import { createTRPCRouter } from '~/server/api/trpc';
import { sprintQueries } from './queries/sprintQueries';

export const sprintRouter = createTRPCRouter({
	...sprintQueries
});
