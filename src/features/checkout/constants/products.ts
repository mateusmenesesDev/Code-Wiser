'server-only';

export const creditPackages = [
	{
		id: 'credits_500',
		credits: 500,
		priceId: process.env.STRIPE_CREDITS_500_PRICE_ID
	},
	{
		id: 'credits_1500',
		credits: 1500,
		priceId: process.env.STRIPE_CREDITS_1500_PRICE_ID
	},
	{
		id: 'credits_3000',
		credits: 3000,
		priceId: process.env.STRIPE_CREDITS_3000_PRICE_ID
	}
];
