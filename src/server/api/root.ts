import { createCallerFactory, createTRPCRouter } from '~/server/api/trpc';
import { projectRouter } from './routers/project';
import { projectBaseRouter } from './routers/projectBase';
import { taskRouter } from './routers/task/taskRouter';
import { projectTemplateRouter } from './routers/template';
import { userRouter } from './routers/user';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	user: userRouter,
	project: projectRouter,
	projectBase: projectBaseRouter,
	projectTemplate: projectTemplateRouter,
	task: taskRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
