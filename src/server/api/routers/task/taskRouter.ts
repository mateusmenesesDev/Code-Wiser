import { createTRPCRouter } from '../../trpc';
import { taskMutations } from './mutations/taskMutations';

export const taskRouter = createTRPCRouter({
	...taskMutations
});
