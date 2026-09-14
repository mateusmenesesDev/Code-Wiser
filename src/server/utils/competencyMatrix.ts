export type CompetencyState =
	| 'NOT_EVALUATED'
	| 'IN_DEVELOPMENT'
	| 'DEMONSTRATED';

export type CompetencyEvidence = {
	source: 'EXERCISE' | 'PROJECT' | 'PR_REVIEW' | 'MENTOR';
	state: Exclude<CompetencyState, 'NOT_EVALUATED'>;
	title: string;
	detail: string;
	date: Date;
};

export type CompetencyMatrixEntry = {
	slug: string;
	name: string;
	description: string;
	state: CompetencyState;
	evidence: CompetencyEvidence[];
	mappedResources: {
		exercises: number;
		learningOutcomes: number;
		milestones: number;
		reviewCategories: number;
	};
};

type MatrixEvidence = CompetencyEvidence & { competencySlug: string };

type MatrixCompetency = Omit<
	CompetencyMatrixEntry,
	'state' | 'evidence' | 'mappedResources'
> & {
	exerciseChallengeIds: string[];
	learningOutcomeIds: string[];
	milestoneIds: string[];
	reviewCategories: string[];
};

const stateRank: Record<Exclude<CompetencyState, 'NOT_EVALUATED'>, number> = {
	IN_DEVELOPMENT: 1,
	DEMONSTRATED: 2
};

export function buildCompetencyMatrix({
	competencies,
	evidence
}: {
	competencies: MatrixCompetency[];
	evidence: MatrixEvidence[];
}) {
	return competencies.map(
		({
			exerciseChallengeIds,
			learningOutcomeIds,
			milestoneIds,
			reviewCategories,
			...competency
		}) => {
			const allEvidence = evidence
				.filter((item) => item.competencySlug === competency.slug)
				.map(({ competencySlug: _competencySlug, ...item }) => item);
			const state = allEvidence.reduce<CompetencyState>(
				(current, item) =>
					stateRank[item.state] >
					(current === 'NOT_EVALUATED' ? 0 : stateRank[current])
						? item.state
						: current,
				'NOT_EVALUATED'
			);

			const competencyEvidence = allEvidence
				.sort((a, b) => b.date.getTime() - a.date.getTime())
				.slice(0, 3);

			return {
				...competency,
				state,
				evidence: competencyEvidence,
				mappedResources: {
					exercises: exerciseChallengeIds.length,
					learningOutcomes: learningOutcomeIds.length,
					milestones: milestoneIds.length,
					reviewCategories: reviewCategories.length
				}
			};
		}
	);
}

export function evidenceForCompetency(
	competencySlug: string,
	evidence: CompetencyEvidence
): MatrixEvidence {
	return { competencySlug, ...evidence };
}
