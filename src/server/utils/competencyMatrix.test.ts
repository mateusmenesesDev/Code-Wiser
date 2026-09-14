import { describe, expect, it } from 'vitest';
import {
	buildCompetencyMatrix,
	evidenceForCompetency
} from './competencyMatrix';

const competency = {
	slug: 'testing',
	name: 'Testing',
	description: 'Protect behavior with tests.',
	exerciseChallengeIds: ['challenge-1'],
	learningOutcomeIds: [],
	milestoneIds: [],
	reviewCategories: ['TESTS']
};

describe('buildCompetencyMatrix', () => {
	it('keeps an unevaluated competency without inventing evidence', () => {
		expect(
			buildCompetencyMatrix({ competencies: [competency], evidence: [] })
		).toEqual([
			{
				slug: 'testing',
				name: 'Testing',
				description: 'Protect behavior with tests.',
				state: 'NOT_EVALUATED',
				evidence: [],
				mappedResources: {
					exercises: 1,
					learningOutcomes: 0,
					milestones: 0,
					reviewCategories: 1
				}
			}
		]);
	});

	it('promotes the state to demonstrated and limits evidence to the latest three items', () => {
		const evidence = [0, 1, 2, 3].map((offset) =>
			evidenceForCompetency('testing', {
				source: 'EXERCISE',
				state: offset === 0 ? 'DEMONSTRATED' : 'IN_DEVELOPMENT',
				title: `Challenge ${offset}`,
				detail: 'APPROVED',
				date: new Date(`2026-08-2${offset + 1}T00:00:00.000Z`)
			})
		);

		const [result] = buildCompetencyMatrix({
			competencies: [competency],
			evidence
		});

		expect(result?.state).toBe('DEMONSTRATED');
		expect(result?.evidence).toHaveLength(3);
		expect(result?.evidence[0]?.title).toBe('Challenge 3');
	});
});
