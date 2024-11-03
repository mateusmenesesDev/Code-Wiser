import type { Project } from '@prisma/client';
import type { z } from 'zod';
import type { RouterOutputs } from '~/trpc/react';
import type { projectSchema } from '../schemas/projects.schema';

export type ProjectDetails = {
	details: string;
	technologies: string[];
	learningOutcomes: string[];
	startDate: string;
	endDate: string;
	timeline: string;
};

export type Milestone = {
	id: string;
	title: string;
	completed: boolean;
};

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

export type ProjectApiResponse = RouterOutputs['project']['getAll'][0];

export type ProjectDatabase = Project;

export type ProjectCard = {
	id: string;
	title: string;
	description: string;
	category: string;
	difficulty: string;
	mentor: string;
	participants: number;
	maxParticipants: number;
	status: 'Started' | 'Completed' | 'Not Started';
	completionRate: number;
	credits: number;
	details: string;
	startDate: Date;
	endDate: Date;
	technologies: string[];
	learningOutcomes: Milestone[];
	milestones: Milestone[];
	discussions: Discussion[];
	resources: Resource[];
	images: ProjectImage[];
};

export type ProjectFormData = z.infer<typeof projectSchema>;
