import { createTRPCRouter } from '../../trpc';
import { epicTemplateMutations } from './mutations/epic/epicTemplateMutations';
import { projectTemplateMutations } from './mutations/projectTemplateMutations';
import { sprintTemplateMutations } from './mutations/sprint/sprintTemplate.mutation';
import { epicTemplateQueries } from './queries/epic/epicTemplateQueries';
import { projectTemplateQueries } from './queries/project/projectTemplateQueries';
import { sprintTemplateQueries } from './queries/sprint/sprintTemplate.query';

export const projectTemplateRouter = createTRPCRouter({
	...projectTemplateQueries,
	...projectTemplateMutations,
	epic: { ...epicTemplateMutations, ...epicTemplateQueries },
	sprint: { ...sprintTemplateQueries, ...sprintTemplateMutations }
});
