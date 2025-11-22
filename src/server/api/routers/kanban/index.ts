import { createTRPCRouter } from '~/server/api/trpc';
import { getKanbanQueries } from './queries/getKanbanQueries';

export const kanbanRouter = createTRPCRouter({
	...getKanbanQueries
});
