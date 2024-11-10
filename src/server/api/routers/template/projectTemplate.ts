import { createTRPCRouter } from '../../trpc';
import { projectTemplateMutations } from './mutations/projectTemplateMutations';
import { getProjectTemplateQueries } from './queries/getProjectTemplateQueries';

export const projectTemplateRouter = createTRPCRouter({
	...getProjectTemplateQueries,
	...projectTemplateMutations
});
