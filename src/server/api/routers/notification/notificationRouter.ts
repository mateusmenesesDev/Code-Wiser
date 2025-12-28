import { createTRPCRouter } from '~/server/api/trpc';
import { notificationMutations } from './mutations/notification.mutations';
import { notificationQueries } from './queries/notification.queries';

export const notificationRouter = createTRPCRouter({
	...notificationQueries,
	...notificationMutations
});
