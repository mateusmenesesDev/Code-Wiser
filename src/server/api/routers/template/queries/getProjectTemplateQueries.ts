import { epicTemplateQueries } from './epic/epicTemplateQueries';
import { projectTemplateQueries } from './project/projectTemplateQueries';
import { sprintTemplateQueries } from './sprint/sprintTemplate.query';

export const getProjectTemplateQueries = {
	...projectTemplateQueries,
	...epicTemplateQueries,
	...sprintTemplateQueries
};
