import { z } from 'zod';

export const passwordSchema = z
	.string()
	.min(8, 'Password must be at least 8 characters')
	.max(100, 'Password must be at most 100 characters')
	.regex(
		/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
		'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character'
	);

export const basicUserSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	email: z.string().email('Invalid email address')
});

export const userDbSchema = z.object({
	id: z.string(),
	email: z.string().email('Invalid email address')
});

export const signInSchema = basicUserSchema
	.omit({ name: true, lastName: true })
	.extend({
		password: z.string()
	});

export const signUpSchema = basicUserSchema
	.extend({
		password: passwordSchema,
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	});

export const verifyEmailSchema = z.object({
	code: z.string()
});

export const forgotPasswordSchema = z.object({
	email: z.string().email()
});

export const resetPasswordSchema = z
	.object({
		code: z.string(),
		password: passwordSchema,
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	});
