import type Stripe from 'stripe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import mockDb from '~/server/__mocks__/db';
import { fulfillCreditCheckout } from '~/server/services/stripeCreditCheckout';

vi.mock('~/server/db', () => ({
	db: mockDb
}));

vi.mock('~/features/checkout/constants/products', () => ({
	creditPackages: [{ id: 'credits_500', credits: 500, priceId: 'price-500' }]
}));

vi.mock('~/services/stripe', () => ({
	stripe: {
		checkout: {
			sessions: {
				listLineItems: vi.fn()
			}
		}
	}
}));

import { stripe } from '~/services/stripe';

describe('Stripe credit checkout fulfillment', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDb.$transaction.mockImplementation(async (callback) =>
			callback(mockDb)
		);
		mockDb.stripeWebhookEvent.createMany.mockResolvedValue({ count: 1 });
		mockDb.creditTransaction.createMany.mockResolvedValue({ count: 1 });
		mockDb.creditTransaction.findUnique.mockResolvedValue({
			id: 'credit-transaction-1'
		} as never);
		mockDb.user.findUnique.mockResolvedValue({ id: 'user-1' } as never);
		mockDb.user.updateMany.mockResolvedValue({ count: 1 });
		vi.mocked(stripe.checkout.sessions.listLineItems).mockResolvedValue({
			data: [
				{
					price: { id: 'price-500' },
					quantity: 1
				}
			]
		} as never);
	});

	it('records a paid checkout as one purchase transaction', async () => {
		await fulfillCreditCheckout(
			{
				id: 'cs-1',
				customer: 'cus-1',
				payment_status: 'paid'
			} as Stripe.Checkout.Session,
			{
				id: 'evt-1',
				type: 'checkout.session.completed',
				created: 1,
				data: { object: {} }
			} as Stripe.Event
		);

		expect(mockDb.stripeWebhookEvent.createMany).toHaveBeenCalledWith({
			data: expect.objectContaining({
				id: 'evt-1',
				externalObjectId: 'cs-1'
			}),
			skipDuplicates: true
		});
		expect(mockDb.creditTransaction.createMany).toHaveBeenCalledWith({
			data: expect.objectContaining({
				userId: 'user-1',
				value: 500,
				type: 'PURCHASE',
				source: 'STRIPE_CHECKOUT',
				externalReference: 'cs-1',
				idempotencyKey: 'stripe:checkout:cs-1'
			}),
			skipDuplicates: true
		});
	});

	it('does not credit the same checkout twice across webhook event ids', async () => {
		const session = {
			id: 'cs-duplicate',
			customer: 'cus-1',
			payment_status: 'paid'
		} as Stripe.Checkout.Session;
		const firstEvent = {
			id: 'evt-first',
			type: 'checkout.session.completed',
			created: 1,
			data: { object: {} }
		} as Stripe.Event;

		await fulfillCreditCheckout(session, firstEvent);
		mockDb.stripeWebhookEvent.createMany.mockResolvedValue({ count: 1 });
		mockDb.creditTransaction.createMany.mockResolvedValue({ count: 0 });
		mockDb.creditTransaction.findUnique.mockResolvedValue({
			id: 'credit-transaction-1',
			userId: 'user-1',
			type: 'PURCHASE',
			value: 500,
			source: 'STRIPE_CHECKOUT',
			externalReference: 'cs-duplicate',
			reversalOfId: null
		} as never);

		await fulfillCreditCheckout(session, {
			...firstEvent,
			id: 'evt-second',
			type: 'checkout.session.async_payment_succeeded'
		} as unknown as Stripe.Event);

		expect(mockDb.creditTransaction.createMany).toHaveBeenCalledTimes(2);
		expect(mockDb.user.updateMany).toHaveBeenCalledTimes(1);
	});

	it('does not fulfill unpaid sessions', async () => {
		await fulfillCreditCheckout(
			{
				id: 'cs-unpaid',
				customer: 'cus-1',
				payment_status: 'unpaid'
			} as Stripe.Checkout.Session,
			{
				id: 'evt-unpaid',
				type: 'checkout.session.completed',
				created: 1,
				data: { object: {} }
			} as Stripe.Event
		);

		expect(stripe.checkout.sessions.listLineItems).not.toHaveBeenCalled();
		expect(mockDb.$transaction).not.toHaveBeenCalled();
	});
});
