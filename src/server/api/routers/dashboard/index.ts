import { createTRPCRouter } from '~/server/api/trpc';
import { dashboardRouter } from './dashboard.router';

export const dashboard = createTRPCRouter(dashboardRouter);
