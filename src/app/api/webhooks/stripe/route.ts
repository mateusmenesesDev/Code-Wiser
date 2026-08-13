import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { env } from '~/env';
import {
	handleSubscriptionDeleted,
	updateUserMentorshipFromSubscription
} from '~/server/api/routers/user/actions';
import { db } from '~/server/db';
import {
	fulfillCreditCheckout,
	markCreditCheckoutFailed
} from '~/server/services/stripeCreditCheckout';
import { stripe } from '~/services/stripe';

const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

const relevantEvents = new Set<Stripe.Event.Type>([
	'checkout.session.completed',
	'checkout.session.async_payment_succeeded',
	'checkout.session.async_payment_failed',
	'customer.subscription.updated',
	'customer.subscription.deleted'
]);

export async function POST(req: Request) {
	const body = await req.text();
	const sig = headers().get('stripe-signature');

	if (!sig) {
		return NextResponse.json(
			{ error: 'Missing stripe-signature header' },
			{ status: 400 }
		);
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
	} catch (err) {
		console.error('Webhook signature verification failed.', err);
		return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
	}

	if (relevantEvents.has(event.type)) {
		try {
			switch (event.type) {
				case 'checkout.session.completed':
				case 'checkout.session.async_payment_succeeded': {
					const session = event.data.object as Stripe.Checkout.Session;
					if (session.metadata?.mode === 'credits') {
						await fulfillCreditCheckout(session, event);
					}
					break;
				}

				case 'checkout.session.async_payment_failed': {
					const session = event.data.object as Stripe.Checkout.Session;
					if (session.metadata?.mode === 'credits') {
						await markCreditCheckoutFailed(session.id);
					}
					break;
				}

				case 'customer.subscription.updated': {
					const subscription = event.data.object as Stripe.Subscription;
					await db.$transaction(async (tx) => {
						const eventResult = await tx.stripeWebhookEvent.createMany({
							data: {
								id: event.id,
								type: event.type,
								externalObjectId: subscription.id,
								stripeCreatedAt: new Date(event.created * 1000)
							},
							skipDuplicates: true
						});
						if (eventResult.count > 0) {
							await updateUserMentorshipFromSubscription(subscription, tx);
						}
					});
					break;
				}

				case 'customer.subscription.deleted': {
					const subscription = event.data.object as Stripe.Subscription;
					await db.$transaction(async (tx) => {
						const eventResult = await tx.stripeWebhookEvent.createMany({
							data: {
								id: event.id,
								type: event.type,
								externalObjectId: subscription.id,
								stripeCreatedAt: new Date(event.created * 1000)
							},
							skipDuplicates: true
						});
						if (eventResult.count > 0) {
							await handleSubscriptionDeleted(subscription, tx);
						}
					});
					break;
				}
			}
		} catch (err) {
			console.error(`Error handling ${event.type}`, err);
			return NextResponse.json(
				{ error: 'Webhook handler failed' },
				{ status: 500 }
			);
		}
	}

	return NextResponse.json({ received: true }, { status: 200 });
}
