import { z } from 'zod';

export const learningGoalValues = [
	'GET_FIRST_JOB',
	'GROW_IN_CURRENT_ROLE',
	'CHANGE_SPECIALTY',
	'BUILD_PORTFOLIO',
	'PREPARE_FOR_INTERVIEWS',
	'EXPLORE_DEVELOPMENT'
] as const;

export const selfReportedLevelValues = [
	'BEGINNER',
	'INTERMEDIATE',
	'ADVANCED'
] as const;

export const technologyValues = [
	'JAVASCRIPT',
	'TYPESCRIPT',
	'REACT',
	'NEXT_JS',
	'NODE_JS',
	'PYTHON',
	'SQL',
	'TESTING'
] as const;

export const weeklyAvailabilityBandValues = [
	'UNDER_3',
	'FROM_4_TO_7',
	'FROM_8_TO_12',
	'OVER_12'
] as const;

export const diagnosisSchema = z.object({
	learningGoal: z.enum(learningGoalValues),
	selfReportedLevel: z.enum(selfReportedLevelValues),
	interestedTechnologies: z.array(z.enum(technologyValues)).min(1).max(5),
	weeklyAvailabilityBand: z.enum(weeklyAvailabilityBandValues),
	priorExperience: z.string().trim().max(1000)
});

export type DiagnosisInput = z.infer<typeof diagnosisSchema>;
