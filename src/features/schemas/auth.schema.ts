import { z } from 'zod';

export const basicUserSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	email: z.string().email('Invalid email address')
});

export const userDbSchema = z.object({
	id: z.string(),
	email: z.string().email('Invalid email address'),
	name: z.string().min(1, 'Name is required')
});
