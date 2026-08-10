import { createTRPCRouter } from '../../trpc';
import { taskAttachmentRouter } from './attachments/taskAttachmentRouter';
import { taskMutations } from './mutations/taskMutations';
import { taskQueries } from './queries/task.queries';

export const taskRouter = createTRPCRouter({
	...taskMutations,
	...taskQueries,
	attachments: taskAttachmentRouter
});
