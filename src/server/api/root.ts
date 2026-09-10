import { createCallerFactory, createTRPCRouter } from '~/server/api/trpc';
import { agendaRouter } from './routers/agenda';
import { aiRouter } from './routers/ai/ai.router';
import { commentRouter } from './routers/comment';
import { dashboard } from './routers/dashboard';
import { epicRouter } from './routers/epic/epic.router';
import { exerciseRouter } from './routers/exercise';
import { feedbackRouter } from './routers/feedback';
import { githubRouter } from './routers/github';
import { kanbanRouter } from './routers/kanban';
import { mentorAttentionRouter } from './routers/mentorAttention';
import { mentorshipRouter } from './routers/mentorship/mentorship';
import { notificationRouter } from './routers/notification/notificationRouter';
import { onboardingRouter } from './routers/onboarding/onboarding.router';
import { planningPokerRouter } from './routers/planningPoker/planningPokerRouter';
import { prReviewRouter } from './routers/prReview/prReviewRouter';
import { productVersionRouter } from './routers/productVersion';
import { projectRouter } from './routers/project';
import { retrospectiveRouter } from './routers/retrospective';
import { searchRouter } from './routers/search/search.router';
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
	productVersion: productVersionRouter,
	projectTemplate: projectTemplateRouter,
	task: taskRouter,
	sprint: sprintRouter,
	retrospective: retrospectiveRouter,
	epic: epicRouter,
	comment: commentRouter,
	dashboard,
	kanban: kanbanRouter,
	ai: aiRouter,
	agenda: agendaRouter,
	prReview: prReviewRouter,
	planningPoker: planningPokerRouter,
	notification: notificationRouter,
	onboarding: onboardingRouter,
	mentorship: mentorshipRouter,
	mentorAttention: mentorAttentionRouter,
	exercise: exerciseRouter,
	feedback: feedbackRouter,
	github: githubRouter,
	search: searchRouter
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
