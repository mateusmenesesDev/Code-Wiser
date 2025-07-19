'server-only';

export const creditPackages = [
	{
		id: 'credits_500',
		priceId: process.env.STRIPE_CREDITS_500_PRICE_ID
	},
	{
		id: 'credits_1500',
		priceId: process.env.STRIPE_CREDITS_1500_PRICE_ID
	},
	{
		id: 'credits_3000',
		priceId: process.env.STRIPE_CREDITS_3000_PRICE_ID
	}
];
