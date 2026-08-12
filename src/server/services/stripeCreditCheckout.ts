import type Stripe from 'stripe';
import { creditPackages } from '~/features/checkout/constants/products';
import { db } from '~/server/db';
import { stripe } from '~/services/stripe';
import { applyCreditTransaction } from './creditLedger';

export async function fulfillCreditCheckout(
	session: Stripe.Checkout.Session,
	event: Stripe.Event
) {
	if (session.payment_status !== 'paid') {
		return;
	}

	const customerId =
		typeof session.customer === 'string'
			? session.customer
			: session.customer?.id;
	if (!customerId) {
		throw new Error('Stripe checkout session has no customer');
	}

	const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
		expand: ['data.price']
	});
	const credits = lineItems.data.reduce((total, item) => {
		const packageForPrice = creditPackages.find(
			(pkg) => pkg.priceId === item.price?.id
		);
		return total + (packageForPrice?.credits ?? 0) * (item.quantity ?? 1);
	}, 0);

	if (credits <= 0) {
		throw new Error('Stripe checkout session has no recognized credit package');
	}

	await db.$transaction(async (tx) => {
		const eventResult = await tx.stripeWebhookEvent.createMany({
			data: {
				id: event.id,
				type: event.type,
				externalObjectId: session.id,
				stripeCreatedAt: new Date(event.created * 1000)
			},
			skipDuplicates: true
		});

		if (eventResult.count === 0) {
			return;
		}

		const user = await tx.user.findUnique({
			where: { stripeCustomerId: customerId },
			select: { id: true }
		});
		if (!user) {
			throw new Error('User for Stripe customer was not found');
		}

		await applyCreditTransaction(tx, {
			userId: user.id,
			type: 'PURCHASE',
			value: credits,
			source: 'STRIPE_CHECKOUT',
			externalReference: session.id,
			idempotencyKey: `stripe:checkout:${session.id}`
		});
	});
}
