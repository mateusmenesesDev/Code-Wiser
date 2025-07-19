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
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body: CheckoutInput = await request.json();

	const { credit, mode } = body;
	const { error } = checkoutSchema.safeParse(body);
	if (error) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}
	const priceId = creditPackages.find((pkg) => pkg.id === credit)?.priceId;
	if (!priceId) {
		return NextResponse.json(
			{ error: 'Invalid credit package' },
			{ status: 400 }
		);
	}

	try {
		const user = await db.user.findUnique({
			where: { id: session.userId }
		});
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}
		let stripeCustomerId = user.stripeCustomerId;
		if (!stripeCustomerId) {
			const stripeCustomer = await stripe.customers.create({
				email: user.email
			});
			stripeCustomerId = stripeCustomer.id;
			await db.user.update({
				where: { id: session.userId },
				data: { stripeCustomerId }
			});
		}

		const headersList = headers();
		const origin = headersList.get('origin');

		const checkoutSession = await stripe.checkout.sessions.create({
			customer: stripeCustomerId,
			line_items: [
				{
					price: priceId,
					quantity: 1
				}
			],
			mode,
			success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}/canceled?canceled=true`,
			metadata: {
				mode: mode === 'payment' ? 'credits' : 'subscription'
			}
		});
		if (!checkoutSession.url) {
			throw new Error('No session URL');
		}

		return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
	} catch (err) {
		if (err instanceof Error) {
			return NextResponse.json({ error: err.message }, { status: 500 });
		}
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
