import { createTRPCRouter } from '../../trpc';
import { epicTemplateMutations } from './mutations/epic/epicTemplateMutations';
import { projectTemplateMutations } from './mutations/projectTemplateMutations';
import { epicTemplateQueries } from './queries/epic/epicTemplateQueries';
import { projectTemplateQueries } from './queries/project/projectTemplateQueries';

export const projectTemplateRouter = createTRPCRouter({
	...projectTemplateQueries,
	...projectTemplateMutations,
	epic: { ...epicTemplateMutations, ...epicTemplateQueries }
});
