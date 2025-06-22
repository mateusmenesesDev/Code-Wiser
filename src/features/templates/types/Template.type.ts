import type { z } from 'zod';
import type { RouterOutputs } from '~/trpc/react';
import type {
	createProjectTemplateSchema,
	deleteTemplateSchema,
	requestChangesSchema,
	updateTemplateStatusSchema
} from '../schemas/template.schema';

export type ProjectTemplateApprovalApiResponse =
	RouterOutputs['projectTemplate']['getBySlug'];

export type UpdateTemplateStatusInput = z.infer<
	typeof updateTemplateStatusSchema
>;
export type DeleteTemplateInput = z.infer<typeof deleteTemplateSchema>;
export type RequestChangesInput = z.infer<typeof requestChangesSchema>;
export type CreateProjectTemplateInput = z.infer<
	typeof createProjectTemplateSchema
>;
