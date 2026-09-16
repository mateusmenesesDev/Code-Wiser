import { LearningJourneyEventType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import {
	tryRecordFirstLearningAction,
	tryRecordLearningJourneyEvent
} from './learningJourney.service';

describe('learning journey event recording', () => {
	it('uses a stable unique key for the first action', async () => {
		const upsert = vi.fn().mockResolvedValue({ id: 'event-1' });
		const db = { learningJourneyEvent: { upsert } } as never;
		const occurredAt = new Date('2026-09-18T10:00:00.000Z');

		await tryRecordFirstLearningAction(db, 'learner-1', occurredAt);

		expect(upsert).toHaveBeenCalledWith({
			where: { eventKey: 'first-action:learner-1' },
			create: {
				userId: 'learner-1',
				eventType: LearningJourneyEventType.FIRST_ACTION,
				eventKey: 'first-action:learner-1',
				entityType: 'LEARNING_JOURNEY',
				entityId: 'learner-1',
				recommendationKey: undefined,
				occurredAt
			},
			update: {}
		});
	});

	it('does not make analytics failure fail the learning flow', async () => {
		const upsert = vi
			.fn()
			.mockRejectedValue(new Error('analytics unavailable'));
		const db = { learningJourneyEvent: { upsert } } as never;
		const error = vi
			.spyOn(console, 'error')
			.mockImplementation(() => undefined);

		await expect(
			tryRecordLearningJourneyEvent(db, {
				userId: 'learner-1',
				eventType: LearningJourneyEventType.REMEDIATION_COMPLETED,
				eventKey: 'remediation-completed:action-1',
				entityType: 'REMEDIATION_ACTION',
				entityId: 'action-1'
			})
		).resolves.toBeNull();
		expect(error).toHaveBeenCalledOnce();
		error.mockRestore();
	});
});
