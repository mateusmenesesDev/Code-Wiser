import { createTRPCRouter } from '~/server/api/trpc';
import { notificationQueries } from './queries/notification.queries';
import { notificationMutations } from './mutations/notification.mutations';

export const notificationRouter = createTRPCRouter({
	...notificationQueries,
	...notificationMutations
});
