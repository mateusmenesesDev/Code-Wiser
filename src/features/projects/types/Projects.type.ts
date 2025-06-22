import type { Project } from '@prisma/client';
import type { z } from 'zod';
import type { createProjectTemplateSchema } from '~/features/templates/schemas/template.schema';
import type { RouterInputs, RouterOutputs } from '~/trpc/react';

export type Discussion = {
	id: string;
	user: string;
	message: string;
	timestamp: string;
};

export type Resource = {
	id: string;
	title: string;
	description: string;
	link: string;
};

export type ProjectImage = {
	id: string;
	src: string;
	alt: string;
};

export type ProjectTemplateApiResponse =
	RouterOutputs['projectTemplate']['getAll'][0];
export type ProjectTemplateBySlugApiResponse =
	RouterOutputs['projectTemplate']['getInfoBySlug'];
export type CreateProjectTemplateApiInput =
	RouterInputs['projectTemplate']['create'];

export type UserProjectApiResponse = RouterOutputs['project']['getEnrolled'][0];

export type ProjectDatabase = Project;

export type ProjectTemplateFormData = z.infer<
	typeof createProjectTemplateSchema
>;
