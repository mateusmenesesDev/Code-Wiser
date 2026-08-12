import type { Prisma, PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import type Stripe from 'stripe';
import { db } from '~/server/db';

type UserDatabase = PrismaClient | Prisma.TransactionClient;

export const updateUserMentorshipFromSubscription = async (
	subscription: Stripe.Subscription,
	database: UserDatabase = db
) => {
	const customerId = subscription.customer as string;
	const user = await database.user.findUnique({
		where: { stripeCustomerId: customerId }
	});
	if (!user) {
		throw new Error('User not found');
	}

	const periods = subscription as Stripe.Subscription & {
		current_period_start: number;
		current_period_end: number;
	};

	const isActive =
		subscription.status === 'active' || subscription.status === 'trialing';

	const periodStart = periods.current_period_start
		? dayjs.unix(periods.current_period_start).toDate()
		: null;
	const periodEnd = periods.current_period_end
		? dayjs.unix(periods.current_period_end).toDate()
		: null;

	const item = periods.items.data[0];
	if (!item) {
		throw new Error('No item found in subscription');
	}
	const mentorshipTypeRaw = item.price.metadata?.plan ?? 'MONTHLY';

	const mentorshipType = ['MONTHLY', 'QUARTERLY', 'SEMIANNUAL'].includes(
		mentorshipTypeRaw.toUpperCase()
	)
		? (mentorshipTypeRaw.toUpperCase() as
				| 'MONTHLY'
				| 'QUARTERLY'
				| 'SEMIANNUAL')
		: 'MONTHLY';

	await database.user.update({
		where: { stripeCustomerId: customerId },
		data: {
			stripeSubscriptionId: subscription.id,
			mentorshipStatus: isActive ? 'ACTIVE' : 'INACTIVE',
			mentorshipType,
			mentorshipStartDate: periodStart,
			mentorshipEndDate: periodEnd
		}
	});

	console.log(
		`Mentorship updated for customer ${customerId} with status ${isActive ? 'ACTIVE' : 'INACTIVE'} and type ${mentorshipType}`
	);
};

export const handleSubscriptionDeleted = async (
	subscription: Stripe.Subscription,
	database: UserDatabase = db
) => {
	const customerId = subscription.customer as string;

	await database.user.update({
		where: { stripeCustomerId: customerId },
		data: {
			mentorshipStatus: 'INACTIVE',
			stripeSubscriptionId: null,
			mentorshipEndDate: new Date()
		}
	});

	console.log(
		`Subscription ${subscription.id} canceled for customer ${customerId}`
	);
};
