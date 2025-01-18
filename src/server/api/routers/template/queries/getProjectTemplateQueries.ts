import { epicTemplateQueries } from './epic/epicTemplateQueries';
import { projectTemplateQueries } from './project/projectTemplateQueries';

export const getProjectTemplateQueries = {
	...projectTemplateQueries,
	...epicTemplateQueries
};
