import { createTRPCRouter } from '../../trpc';
import { taskMutations } from './mutations/taskMutations';
import { taskQueries } from './queries/task.queries';
export const taskRouter = createTRPCRouter({
	...taskMutations,
	...taskQueries
});
