import type { z } from 'zod';
import type { RouterOutputs } from '~/trpc/react';
import type {
	createProjectTemplateSchema,
	deleteTemplateSchema,
	updateTemplateBasicInfoInputSchema,
	updateTemplateStatusSchema
} from '../schemas/template.schema';

export type ProjectTemplateApprovalApiResponse =
	RouterOutputs['projectTemplate']['getBySlug'];

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
