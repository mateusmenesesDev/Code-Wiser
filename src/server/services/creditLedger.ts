import type {
	CreditTransactionSource,
	CreditTransactionType,
	Prisma
} from '@prisma/client';
import { TRPCError } from '@trpc/server';

export type CreditLedgerTransactionInput = {
	userId: string;
	type: CreditTransactionType;
	value: number;
	source: CreditTransactionSource;
	externalReference: string;
	idempotencyKey: string;
	reversalOfId?: string;
	actorUserId?: string;
	note?: string;
};

export async function applyCreditTransaction(
	tx: Prisma.TransactionClient,
	input: CreditLedgerTransactionInput
): Promise<{ applied: boolean; transactionId: string }> {
	if (!Number.isInteger(input.value) || input.value === 0) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Credit transaction value must be a non-zero integer'
		});
	}

	const result = await tx.creditTransaction.createMany({
		data: {
			userId: input.userId,
			type: input.type,
			value: input.value,
			source: input.source,
			externalReference: input.externalReference,
			idempotencyKey: input.idempotencyKey,
			reversalOfId: input.reversalOfId,
			actorUserId: input.actorUserId,
			note: input.note
		},
		skipDuplicates: true
	});

	if (result.count === 0) {
		const existing = await tx.creditTransaction.findUnique({
			where: { idempotencyKey: input.idempotencyKey },
			select: {
				id: true,
				userId: true,
				type: true,
				value: true,
				source: true,
				externalReference: true,
				reversalOfId: true,
				actorUserId: true,
				note: true
			}
		});

		if (
			!existing ||
			existing.userId !== input.userId ||
			existing.type !== input.type ||
			existing.value !== input.value ||
			existing.source !== input.source ||
			existing.externalReference !== input.externalReference ||
			existing.reversalOfId !== (input.reversalOfId ?? null) ||
			(existing.actorUserId ?? null) !== (input.actorUserId ?? null) ||
			(existing.note ?? null) !== (input.note ?? null)
		) {
			throw new TRPCError({
				code: 'CONFLICT',
				message: 'Credit idempotency key was already used for another operation'
			});
		}

		return { applied: false, transactionId: existing.id };
	}

	const userUpdate =
		input.value < 0
			? await tx.user.updateMany({
					where: {
						id: input.userId,
						credits: { gte: Math.abs(input.value) }
					},
					data: { credits: { decrement: Math.abs(input.value) } }
				})
			: await tx.user.updateMany({
					where: { id: input.userId },
					data: { credits: { increment: input.value } }
				});

	if (userUpdate.count !== 1) {
		throw new TRPCError({
			code: input.value < 0 ? 'BAD_REQUEST' : 'NOT_FOUND',
			message: input.value < 0 ? 'Insufficient credits' : 'User not found'
		});
	}

	const transaction = await tx.creditTransaction.findUnique({
		where: { idempotencyKey: input.idempotencyKey },
		select: { id: true }
	});

	if (!transaction) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Credit transaction was not created'
		});
	}

	return { applied: true, transactionId: transaction.id };
}
