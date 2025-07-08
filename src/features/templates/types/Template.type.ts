import type { z } from 'zod';
import type { RouterOutputs } from '~/trpc/react';
import type {
	createProjectTemplateSchema,
	deleteTemplateSchema,
	updateTemplateBasicInfoInputSchema,
	updateTemplateSprintsSchema,
	updateTemplateStatusSchema
} from '../schemas/template.schema';

export type ProjectTemplateApprovalApiResponse =
	RouterOutputs['projectTemplate']['getById'];

export type UpdateTemplateStatusInput = z.infer<
	typeof updateTemplateStatusSchema
>;
export type DeleteTemplateInput = z.infer<typeof deleteTemplateSchema>;
export type CreateProjectTemplateInput = z.infer<
	typeof createProjectTemplateSchema
>;
export type UpdateProjectTemplateBasicInfoInput = z.infer<
	typeof updateTemplateBasicInfoInputSchema
>;
export type UpdateTemplateSprintsInput = z.infer<
	typeof updateTemplateSprintsSchema
>;
