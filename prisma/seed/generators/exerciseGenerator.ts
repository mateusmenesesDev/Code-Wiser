import type { PrismaClient } from '@prisma/client';
import { EXERCISE_TRACKS } from '../data/exercises';

export async function createExerciseTracks(prisma: PrismaClient) {
	console.log('🏋️ Creating exercise tracks...');
	const tracks = [];

	for (const trackData of EXERCISE_TRACKS) {
		const track = await prisma.exerciseTrack.upsert({
			where: { slug: trackData.slug },
			update: {
				name: trackData.name,
				description: trackData.description,
				repoUrl: trackData.repoUrl,
				sortOrder: trackData.sortOrder,
				isPublished: trackData.isPublished,
				isArchived: false
			},
			create: {
				name: trackData.name,
				slug: trackData.slug,
				description: trackData.description,
				repoUrl: trackData.repoUrl,
				sortOrder: trackData.sortOrder,
				isPublished: trackData.isPublished
			}
		});

		for (const challengeData of trackData.challenges) {
			await prisma.exerciseChallenge.upsert({
				where: {
					trackId_slug: {
						trackId: track.id,
						slug: challengeData.slug
					}
				},
				update: {
					title: challengeData.title,
					difficulty: challengeData.difficulty,
					description: challengeData.description,
					setupInstructions: challengeData.setupInstructions,
					acceptanceCriteria: challengeData.acceptanceCriteria,
					sortOrder: challengeData.sortOrder,
					isArchived: false
				},
				create: {
					trackId: track.id,
					title: challengeData.title,
					slug: challengeData.slug,
					difficulty: challengeData.difficulty,
					description: challengeData.description,
					setupInstructions: challengeData.setupInstructions,
					acceptanceCriteria: challengeData.acceptanceCriteria,
					sortOrder: challengeData.sortOrder
				}
			});
		}

		tracks.push(track);
	}

	return tracks;
}
