import type { z } from 'zod';
import type { checkoutSchema } from '../schemas/checkout.schema';

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CreditOptions = 'credits_500' | 'credits_1500' | 'credits_3000';
