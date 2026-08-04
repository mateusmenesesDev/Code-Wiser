import { createTRPCRouter } from '../../trpc';
import { exerciseMutations } from './exercise.mutations';
import { exerciseQueries } from './exercise.queries';

export const exerciseRouter = createTRPCRouter({
	...exerciseQueries,
	...exerciseMutations
});
