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

export type Project = {
	id: number;
	title: string;
	description: string;
	category: string;
	difficulty: string;
	mentor: string;
	participants: number;
	maxParticipants: number;
	status: 'Active' | 'Completed' | 'Inactive' | 'Started' | 'Not Started';
	credits: number;
	completionRate: number;
	details: ProjectDetails;
	milestones: Milestone[];
	discussions: Discussion[];
};
