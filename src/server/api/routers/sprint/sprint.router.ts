import { createTRPCRouter } from '../../trpc';
import { sprintMutations } from './mutations/sprint.mutation';
import { sprintQueries } from './queries/sprint.query';

export const sprintRouter = createTRPCRouter({
	...sprintMutations,
	...sprintQueries
});
