import { createCallerFactory, createTRPCRouter } from '~/server/api/trpc';
import { aiRouter } from './routers/ai/ai.router';
import { commentRouter } from './routers/comment';
import { epicRouter } from './routers/epic/epic.router';
import { kanbanRouter } from './routers/kanban';
import { mentorshipRouter } from './routers/mentorship/mentorship';
import { notificationRouter } from './routers/notification/notificationRouter';
import { planningPokerRouter } from './routers/planningPoker/planningPokerRouter';
import { prReviewRouter } from './routers/prReview/prReviewRouter';
import { projectRouter } from './routers/project';
import { sprintRouter } from './routers/sprint/sprint.router';
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
	projectTemplate: projectTemplateRouter,
	task: taskRouter,
	sprint: sprintRouter,
	epic: epicRouter,
	comment: commentRouter,
	kanban: kanbanRouter,
	ai: aiRouter,
	prReview: prReviewRouter,
	planningPoker: planningPokerRouter,
	notification: notificationRouter,
	mentorship: mentorshipRouter
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
