import type { ExerciseChallengeDifficulty } from '@prisma/client';

export const DIFFICULTY_LABELS: Record<ExerciseChallengeDifficulty, string> = {
	EASY: 'Easy',
	MEDIUM: 'Medium',
	HARD: 'Hard'
};

export function difficultyBadgeVariant(
	difficulty: ExerciseChallengeDifficulty
): 'success' | 'warning' | 'destructive' {
	switch (difficulty) {
		case 'EASY':
			return 'success';
		case 'MEDIUM':
			return 'warning';
		case 'HARD':
			return 'destructive';
	}
}
