import { auth } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { creditPackages } from '~/features/checkout/constants/products';
import { checkoutSchema } from '~/features/checkout/schemas/checkout.schema';
import type { CheckoutInput } from '~/features/checkout/types/Checkout.type';
import { db } from '~/server/db';
import { stripe } from '~/services/stripe';

export async function POST(request: Request) {
	const session = await auth();
	if (!session.userId) {
		return NextResponse.json(
			{ error: 'Sign in before buying credits.' },
			{ status: 401 }
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{ error: 'The checkout request was invalid.' },
			{ status: 400 }
		);
	}

	const parsed = checkoutSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{
				error:
					parsed.error.issues[0]?.message ?? 'Choose a valid credit package.'
			},
			{ status: 400 }
		);
	}

	const input: CheckoutInput = parsed.data;
	const { credit, mode } = input;
	const packageForCredit = creditPackages.find((pkg) => pkg.id === credit);
	if (mode !== 'payment' || !packageForCredit?.priceId) {
		return NextResponse.json(
			{ error: 'Choose a valid credit package.' },
			{ status: 400 }
		);
	}

	const idempotencyKey = request.headers.get('idempotency-key');
	if (!idempotencyKey) {
		return NextResponse.json(
			{ error: 'The checkout request is missing its retry key. Try again.' },
			{ status: 400 }
		);
	}

	try {
		const user = await db.user.findUnique({
			where: { id: session.userId },
			select: { id: true, email: true, stripeCustomerId: true }
		});
		if (!user) {
			return NextResponse.json(
				{ error: 'Your account could not be found.' },
				{ status: 404 }
			);
		}

		const existingCheckout = await db.creditCheckout.findUnique({
			where: { requestIdempotencyKey: idempotencyKey },
			select: {
				userId: true,
				packageId: true,
				checkoutUrl: true,
				stripeSessionId: true
			}
		});
		if (existingCheckout) {
			if (
				existingCheckout.userId !== user.id ||
				existingCheckout.packageId !== packageForCredit.id
			) {
				return NextResponse.json(
					{ error: 'This checkout retry key belongs to another purchase.' },
					{ status: 409 }
				);
			}
			if (existingCheckout.checkoutUrl) {
				return NextResponse.json(
					{ url: existingCheckout.checkoutUrl },
					{ status: 200 }
				);
			}
		}

		let stripeCustomerId = user.stripeCustomerId;
		if (!stripeCustomerId) {
			const stripeCustomer = await stripe.customers.create({
				email: user.email
			});
			stripeCustomerId = stripeCustomer.id;
			await db.user.update({
				where: { id: user.id },
				data: { stripeCustomerId }
			});
		}

		const origin = headers().get('origin') ?? new URL(request.url).origin;
		const checkoutSession = await stripe.checkout.sessions.create(
			{
				customer: stripeCustomerId,
				client_reference_id: `credit:${user.id}:${idempotencyKey}`,
				line_items: [{ price: packageForCredit.priceId, quantity: 1 }],
				mode: 'payment',
				success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${origin}/canceled?canceled=true`,
				metadata: {
					mode: 'credits',
					userId: user.id,
					credit: packageForCredit.id,
					checkoutRequestId: idempotencyKey
				}
			},
			{ idempotencyKey }
		);
		if (!checkoutSession.url) {
			throw new Error('Stripe did not return a checkout URL. Try again.');
		}

		await db.creditCheckout.upsert({
			where: { requestIdempotencyKey: idempotencyKey },
			create: {
				userId: user.id,
				requestIdempotencyKey: idempotencyKey,
				stripeSessionId: checkoutSession.id,
				stripeCustomerId,
				packageId: packageForCredit.id,
				credits: packageForCredit.credits,
				status: 'OPEN',
				checkoutUrl: checkoutSession.url,
				expiresAt: checkoutSession.expires_at
					? new Date(checkoutSession.expires_at * 1000)
					: null
			},
			update: {
				stripeSessionId: checkoutSession.id,
				stripeCustomerId,
				checkoutUrl: checkoutSession.url,
				expiresAt: checkoutSession.expires_at
					? new Date(checkoutSession.expires_at * 1000)
					: null
			}
		});

		return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
	} catch (error) {
		console.error('Credit checkout creation failed', error);
		return NextResponse.json(
			{
				error:
					'We could not start checkout. Try again; you will not be charged for this attempt.'
			},
			{ status: 500 }
		);
	}
}
