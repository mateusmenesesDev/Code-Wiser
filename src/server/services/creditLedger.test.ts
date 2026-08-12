import type { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { applyCreditTransaction } from './creditLedger';

const input = {
	userId: 'user-1',
	type: 'CONSUMPTION' as const,
	value: -5,
	source: 'PR_REVIEW_REQUEST' as const,
	externalReference: 'task-1',
	idempotencyKey: 'pr-review:request-1'
};

function transactionClient(overrides: Record<string, unknown> = {}) {
	return {
		creditTransaction: {
			createMany: vi.fn().mockResolvedValue({ count: 1 }),
			findUnique: vi.fn().mockResolvedValue({ id: 'transaction-1' })
		},
		user: {
			updateMany: vi.fn().mockResolvedValue({ count: 1 })
		},
		...overrides
	} as unknown as Prisma.TransactionClient;
}

describe('applyCreditTransaction', () => {
	it('debits the balance and records one transaction atomically', async () => {
		const tx = transactionClient();

		const result = await applyCreditTransaction(tx, input);

		expect(result).toEqual({ applied: true, transactionId: 'transaction-1' });
		expect(tx.creditTransaction.createMany).toHaveBeenCalledWith({
			data: expect.objectContaining(input),
			skipDuplicates: true
		});
		expect(tx.user.updateMany).toHaveBeenCalledWith({
			where: { id: 'user-1', credits: { gte: 5 } },
			data: { credits: { decrement: 5 } }
		});
	});

	it('returns the existing transaction for a repeated identical key', async () => {
		const tx = transactionClient({
			creditTransaction: {
				createMany: vi.fn().mockResolvedValue({ count: 0 }),
				findUnique: vi.fn().mockResolvedValue({
					id: 'transaction-1',
					...input,
					reversalOfId: null
				})
			}
		});

		await expect(applyCreditTransaction(tx, input)).resolves.toEqual({
			applied: false,
			transactionId: 'transaction-1'
		});
		expect(tx.user.updateMany).not.toHaveBeenCalled();
	});

	it('rejects reusing a key with a different operation', async () => {
		const tx = transactionClient({
			creditTransaction: {
				createMany: vi.fn().mockResolvedValue({ count: 0 }),
				findUnique: vi.fn().mockResolvedValue({
					id: 'transaction-1',
					...input,
					reversalOfId: null
				})
			}
		});

		await expect(
			applyCreditTransaction(tx, { ...input, value: -10 })
		).rejects.toMatchObject({ code: 'CONFLICT' });
	});

	it('rejects a debit when the balance is insufficient', async () => {
		const tx = transactionClient();
		vi.mocked(tx.user.updateMany).mockResolvedValue({ count: 0 });

		await expect(applyCreditTransaction(tx, input)).rejects.toMatchObject({
			code: 'BAD_REQUEST'
		});
	});
});
