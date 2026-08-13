import type { CreditCheckoutStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import type Stripe from 'stripe';
import { creditPackages } from '~/features/checkout/constants/products';
import { db } from '~/server/db';
import { stripe } from '~/services/stripe';
import { applyCreditTransaction } from './creditLedger';

type CheckoutEvent = Pick<Stripe.Event, 'id' | 'type' | 'created'>;

type CreditCheckoutRecord = {
	id: string;
	userId: string;
	stripeSessionId: string;
	status: CreditCheckoutStatus;
	checkoutUrl: string | null;
};

function getCheckoutStatus(
	session: Stripe.Checkout.Session,
	failed = false
): CreditCheckoutStatus {
	if (failed) return 'FAILED';
	if (session.status === 'expired') return 'EXPIRED';
	if (session.payment_status === 'paid') return 'PAID';
	if (session.status === 'complete') return 'PROCESSING';
	return 'OPEN';
}

async function updateCheckoutStatus(
	sessionId: string,
	status: CreditCheckoutStatus,
	failureReason?: string
) {
	await db.creditCheckout.updateMany({
		where: {
			stripeSessionId: sessionId,
			status: { not: 'FULFILLED' }
		},
		data: {
			status,
			failureReason: failureReason ?? null
		}
	});
}

export async function markCreditCheckoutFailed(
	sessionId: string,
	reason = 'Stripe could not complete this payment.'
) {
	await updateCheckoutStatus(sessionId, 'FAILED', reason);
}

function getCustomerId(session: Stripe.Checkout.Session) {
	return typeof session.customer === 'string'
		? session.customer
		: session.customer?.id;
}

async function getCreditPackage(session: Stripe.Checkout.Session) {
	const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
		expand: ['data.price']
	});
	const packages = lineItems.data
		.map((item) => creditPackages.find((pkg) => pkg.priceId === item.price?.id))
		.filter((pkg): pkg is (typeof creditPackages)[number] => Boolean(pkg));
	const credits = lineItems.data.reduce((total, item) => {
		const packageForPrice = creditPackages.find(
			(pkg) => pkg.priceId === item.price?.id
		);
		return total + (packageForPrice?.credits ?? 0) * (item.quantity ?? 1);
	}, 0);

	if (credits <= 0 || packages.length === 0) {
		throw new Error('Stripe checkout session has no recognized credit package');
	}

	return {
		packageId: packages.map((pkg) => pkg.id).join(','),
		credits
	};
}

export async function fulfillCreditCheckout(
	session: Stripe.Checkout.Session,
	event?: CheckoutEvent
) {
	if (session.payment_status !== 'paid') {
		await updateCheckoutStatus(session.id, getCheckoutStatus(session));
		return { status: getCheckoutStatus(session) };
	}

	const customerId = getCustomerId(session);
	if (!customerId) {
		throw new Error('Stripe checkout session has no customer');
	}

	const { packageId, credits } = await getCreditPackage(session);
	const metadataUserId = session.metadata?.userId;
	const requestIdempotencyKey =
		session.metadata?.checkoutRequestId ?? `stripe-session:${session.id}`;

	const result = await db.$transaction(async (tx) => {
		if (event) {
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
				return { status: 'FULFILLED' as const };
			}
		}

		const userByCustomer = await tx.user.findUnique({
			where: { stripeCustomerId: customerId },
			select: { id: true, stripeCustomerId: true }
		});
		const userByMetadata = metadataUserId
			? await tx.user.findUnique({
					where: { id: metadataUserId },
					select: { id: true, stripeCustomerId: true }
				})
			: null;
		const user = userByMetadata ?? userByCustomer;

		if (!user) {
			throw new Error('User for Stripe customer was not found');
		}
		if (
			userByMetadata &&
			userByCustomer &&
			userByMetadata.id !== userByCustomer.id
		) {
			throw new Error('Stripe checkout customer does not match checkout user');
		}

		const transaction = await applyCreditTransaction(tx, {
			userId: user.id,
			type: 'PURCHASE',
			value: credits,
			source: 'STRIPE_CHECKOUT',
			externalReference: session.id,
			idempotencyKey: `stripe:checkout:${session.id}`
		});

		await tx.creditCheckout.upsert({
			where: { stripeSessionId: session.id },
			create: {
				userId: user.id,
				requestIdempotencyKey,
				stripeSessionId: session.id,
				stripeCustomerId: customerId,
				packageId,
				credits,
				status: 'FULFILLED',
				checkoutUrl: session.url,
				transactionId: transaction.transactionId
			},
			update: {
				status: 'FULFILLED',
				failureReason: null,
				transactionId: transaction.transactionId
			}
		});

		return {
			status: 'FULFILLED' as const,
			transactionId: transaction.transactionId
		};
	});

	return result;
}

async function getOwnedCheckout(
	sessionId: string,
	userId: string
): Promise<CreditCheckoutRecord> {
	const checkout = await db.creditCheckout.findUnique({
		where: { stripeSessionId: sessionId },
		select: {
			id: true,
			userId: true,
			stripeSessionId: true,
			status: true,
			checkoutUrl: true
		}
	});

	if (!checkout) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Checkout attempt was not found'
		});
	}
	if (checkout.userId !== userId) {
		throw new TRPCError({ code: 'FORBIDDEN' });
	}

	return checkout;
}

export async function refreshCreditCheckout(sessionId: string, userId: string) {
	const checkout = await getOwnedCheckout(sessionId, userId);
	const session = await stripe.checkout.sessions.retrieve(sessionId);

	if (session.payment_status === 'paid') {
		await fulfillCreditCheckout(session);
	} else if (checkout.status !== 'FAILED' || session.status === 'expired') {
		await updateCheckoutStatus(session.id, getCheckoutStatus(session));
	}

	return getOwnedCheckout(sessionId, userId);
}

export async function reconcileCreditCheckout(
	sessionId: string,
	expectedUserId?: string
) {
	const session = await stripe.checkout.sessions.retrieve(sessionId);
	const customerId = getCustomerId(session);
	if (!customerId) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Checkout session has no Stripe customer'
		});
	}

	const checkout = await db.creditCheckout.findUnique({
		where: { stripeSessionId: sessionId },
		select: { userId: true }
	});
	const metadataUserId = session.metadata?.userId;
	const user = await db.user.findUnique({
		where: { stripeCustomerId: customerId },
		select: { id: true }
	});
	const userId = checkout?.userId ?? metadataUserId ?? user?.id;

	if (!userId) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'No CodeWise user matches this checkout'
		});
	}
	if (expectedUserId && userId !== expectedUserId) {
		throw new TRPCError({ code: 'FORBIDDEN' });
	}
	if (session.payment_status !== 'paid') {
		await updateCheckoutStatus(session.id, getCheckoutStatus(session));
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'This checkout is not paid yet'
		});
	}

	return fulfillCreditCheckout(session);
}

export type { CreditCheckoutRecord };
