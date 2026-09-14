import { describe, expect, it } from 'vitest';
import { diagnosisSchema } from './diagnosis.schema';

describe('diagnosisSchema', () => {
	it('accepts a complete learner diagnosis', () => {
		expect(
			diagnosisSchema.parse({
				learningGoal: 'GET_FIRST_JOB',
				selfReportedLevel: 'BEGINNER',
				interestedTechnologies: ['JAVASCRIPT', 'REACT'],
				weeklyAvailabilityBand: 'FROM_4_TO_7',
				priorExperience: 'I have built small personal projects.'
			})
		).toEqual({
			learningGoal: 'GET_FIRST_JOB',
			selfReportedLevel: 'BEGINNER',
			interestedTechnologies: ['JAVASCRIPT', 'REACT'],
			weeklyAvailabilityBand: 'FROM_4_TO_7',
			priorExperience: 'I have built small personal projects.'
		});
	});

	it('requires at least one technology and limits the selection', () => {
		expect(() =>
			diagnosisSchema.parse({
				learningGoal: 'GET_FIRST_JOB',
				selfReportedLevel: 'BEGINNER',
				interestedTechnologies: [],
				weeklyAvailabilityBand: 'FROM_4_TO_7',
				priorExperience: ''
			})
		).toThrow();

		expect(() =>
			diagnosisSchema.parse({
				learningGoal: 'GET_FIRST_JOB',
				selfReportedLevel: 'BEGINNER',
				interestedTechnologies: [
					'JAVASCRIPT',
					'TYPESCRIPT',
					'REACT',
					'NEXT_JS',
					'NODE_JS',
					'PYTHON'
				],
				weeklyAvailabilityBand: 'FROM_4_TO_7',
				priorExperience: ''
			})
		).toThrow();
	});
});
