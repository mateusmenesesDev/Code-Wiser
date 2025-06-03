import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail } from 'lucide-react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { GoogleIcon } from '~/common/components/icons/GoogleIcon';
import { Alert, AlertDescription } from '~/common/components/ui/alert';
import { Button } from '~/common/components/ui/button';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { signInSchema } from '~/features/schemas/auth.schema';

interface SignInFormProps {
	onForgotPassword: () => void;
	onSignUpClick: () => void;
	onSuccess: () => void;
}

export function SignInForm({
	onForgotPassword,
	onSignUpClick,
	onSuccess
}: SignInFormProps) {
	const { signInWithEmail, signInWithGoogle, error } = useAuth();

	const {
		register,
		handleSubmit: handleSubmitForm,
		formState: { isSubmitting, errors }
	} = useForm<z.infer<typeof signInSchema>>({
		resolver: zodResolver(signInSchema)
	});

	const handleSubmit: SubmitHandler<z.infer<typeof signInSchema>> = async (
		data
	) => {
		try {
			await signInWithEmail(data);
			onSuccess();
		} catch (error) {
			console.error('Sign in failed:', error);
		}
	};

	return (
		<form onSubmit={handleSubmitForm(handleSubmit)} className="space-y-4">
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<div className="space-y-2">
				<Label htmlFor="email">Email</Label>
				<div className="relative">
					<Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						id="email"
						type="email"
						placeholder="Enter your email"
						{...register('email')}
						className="pl-10"
					/>
					<ErrorMessage message={errors.email?.message} className="pt-2" />
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="password">Password</Label>
				<div className="relative">
					<Lock className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						id="password"
						type="password"
						placeholder="Enter your password"
						{...register('password')}
						className="pl-10"
					/>
					<ErrorMessage message={errors.password?.message} className="pt-2" />
				</div>
			</div>

			<div className="flex justify-end">
				<Button
					variant="link"
					onClick={onForgotPassword}
					className="h-auto p-0 text-sm"
					type="button"
				>
					Forgot password?
				</Button>
			</div>

			<Button type="submit" className="w-full" disabled={isSubmitting}>
				{isSubmitting ? 'Signing in...' : 'Sign In'}
			</Button>
			<Button
				variant="outline"
				className="w-full"
				onClick={() => {
					signInWithGoogle();
				}}
				type="button"
			>
				<GoogleIcon className="mr-2 h-4 w-4" />
				Sign in with Google
			</Button>

			<div className="text-center text-sm">
				<span className="text-muted-foreground">Don't have an account? </span>
				<Button
					variant="link"
					onClick={onSignUpClick}
					className="h-auto p-0 text-primary hover:underline"
				>
					Sign up
				</Button>
			</div>
		</form>
	);
}
