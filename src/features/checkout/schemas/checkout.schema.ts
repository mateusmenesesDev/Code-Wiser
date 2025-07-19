import { z } from 'zod';

export const checkoutSchema = z
	.object({
		credit: z.enum(['credits_500', 'credits_1500', 'credits_3000']).optional(),
		subscription: z
			.enum([
				'sub_1QZ00000000000000000000',
				'sub_1QZ00000000000000000001',
				'sub_1QZ00000000000000000002'
			])
			.optional(),
		mode: z.enum(['payment', 'subscription'])
	})
	.superRefine((data, ctx) => {
		if (data.mode === 'payment' && !data.credit) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Price ID is required for payment mode'
			});
		}
		if (data.mode === 'subscription' && !data.subscription) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Subscription ID is required for subscription mode'
			});
		}
	});
