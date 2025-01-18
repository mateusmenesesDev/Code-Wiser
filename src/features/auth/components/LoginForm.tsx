'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { GoogleIcon } from '~/common/components/icons/GoogleIcon';
import { Alert, AlertDescription } from '~/common/components/ui/alert';
import { Button } from '~/common/components/ui/button';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { signInSchema } from '~/features/schemas/auth.schema';

export default function LoginForm() {
	const { signInWithEmail, error, signInWithGoogle } = useAuth();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting }
	} = useForm<z.infer<typeof signInSchema>>({
		resolver: zodResolver(signInSchema)
	});

	const onSubmit = async (data: z.infer<typeof signInSchema>) => {
		await signInWithEmail(data);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<div className="grid gap-2">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					type="email"
					placeholder="m@example.com"
					{...register('email')}
				/>
				<ErrorMessage message={errors.email?.message} />
			</div>
			<div className="grid gap-2">
				<Label htmlFor="password">Password</Label>
				<Input id="password" type="password" {...register('password')} />
				<ErrorMessage message={errors.password?.message} />
			</div>
			<Button type="submit" className="w-full" disabled={isSubmitting}>
				{isSubmitting ? 'Logging in...' : 'Login'}
			</Button>
			<Button
				onClick={signInWithGoogle}
				variant="outline"
				className="flex w-full items-center justify-center gap-2"
				type="button"
			>
				<GoogleIcon className="h-5 w-5" />
				Login with Google
			</Button>
		</form>
	);
}
