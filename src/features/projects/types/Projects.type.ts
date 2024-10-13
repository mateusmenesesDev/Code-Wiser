import type { z } from 'zod';
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
	id: number;
	title: string;
	completed: boolean;
};

export type Discussion = {
	id: number;
	user: string;
	message: string;
	timestamp: string;
};

export type Resource = {
	id: number;
	title: string;
	description: string;
	link: string;
};

export type ProjectImage = {
	id: number;
	src: string;
	alt: string;
};

export type Project = {
	id: number;
	title: string;
	description: string;
	category: string;
	difficulty: string;
	mentor: string;
	participants: number;
	maxParticipants: number;
	status: 'Not Started' | 'Started' | 'Completed';
	completionRate: number;
	credits: number;
	details: string;
	startDate: Date;
	endDate: Date;
	technologies: string[];
	learningOutcomes: { value: string }[];
	milestones: { value: string }[];
};

export type ProjectFormData = z.infer<typeof projectSchema>;
