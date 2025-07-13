import type { z } from 'zod';
import type { createProjectTemplateSchema } from '~/features/templates/schemas/template.schema';
import type { RouterInputs, RouterOutputs } from '~/trpc/react';

export type ApprovedProjectsApiOutput =
	RouterOutputs['projectTemplate']['getApproved'];
export type ProjectsTemplateApiOutput =
	RouterOutputs['projectTemplate']['getAll'];
export type ProjectTemplateApiOutput =
	RouterOutputs['projectTemplate']['getById'];
export type CreateProjectTemplateApiInput =
	RouterInputs['projectTemplate']['create'];
export type ProjectTemplateInfoByIdApiOutput =
	RouterOutputs['projectTemplate']['getInfoById'];

export type UserProjectApiResponse = RouterOutputs['project']['getEnrolled'][0];

export type ProjectTemplateFormData = z.infer<
	typeof createProjectTemplateSchema
>;

export type ProjectApiOutput = RouterOutputs['project']['getById'];
