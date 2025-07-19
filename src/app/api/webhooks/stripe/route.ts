import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { env } from '~/env';
import {
	addUserCredits,
	handleSubscriptionDeleted,
	updateUserMentorshipFromSubscription
} from '~/server/api/routers/user/actions';
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
				case 'checkout.session.completed': {
					const session = event.data.object as Stripe.Checkout.Session;
					if (session.metadata?.mode === 'credits') {
						await handleCheckoutSessionCompleted(session);
					}
					break;
				}

				case 'checkout.session.async_payment_succeeded': {
					const session = event.data.object as Stripe.Checkout.Session;
					if (session.metadata?.mode === 'credits') {
						await handleCheckoutSessionCompleted(session);
					}
					break;
				}

				case 'customer.subscription.updated': {
					const subscription = event.data.object as Stripe.Subscription;
					await updateUserMentorshipFromSubscription(subscription);
					break;
				}

				case 'customer.subscription.deleted': {
					const subscription = event.data.object as Stripe.Subscription;
					await handleSubscriptionDeleted(subscription);
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

/**
 * Deal with one-time payments (purchase of credits)
 */
async function handleCheckoutSessionCompleted(
	session: Stripe.Checkout.Session
) {
	const customerId =
		typeof session.customer === 'string'
			? session.customer
			: session.customer?.id;

	if (!customerId) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 });
	}
	const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
		expand: ['data.price.product']
	});

	for (const item of lineItems.data) {
		const credits = Number.parseInt(item.price?.metadata?.credits ?? '0', 10);
		if (credits > 0) {
			await addUserCredits(customerId, credits);
			console.log(`User purchased ${credits} credits`);
		}
	}
}
