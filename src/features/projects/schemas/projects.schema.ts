import { z } from 'zod';

export const createProjectSchema = z.object({
	projectTemplateId: z.string()
});
