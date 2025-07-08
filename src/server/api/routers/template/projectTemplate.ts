import { createTRPCRouter } from '../../trpc';
import { projectTemplateMutations } from './mutations/projectTemplateMutations';
import { projectTemplateQueries } from './queries/project/projectTemplateQueries';

export const projectTemplateRouter = createTRPCRouter({
	...projectTemplateQueries,
	...projectTemplateMutations
});
