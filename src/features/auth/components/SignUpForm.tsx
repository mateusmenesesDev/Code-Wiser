'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@radix-ui/react-label';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { Alert, AlertDescription } from '~/common/components/alert';
import { Button } from '~/common/components/button';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle
} from '~/common/components/card';
import { GoogleIcon } from '~/common/components/icons/GoogleIcon';
import { Input, PasswordInput } from '~/common/components/input';
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot
} from '~/common/components/input-otp';
import { useAuth } from '~/features/auth/hooks/useAuth';
import {
	signUpSchema,
	verifyEmailSchema
} from '~/features/schemas/auth.schema';

export default function SignUpForm() {
	const { signUpWithEmail, signInWithGoogle, error, isVerifying, verifyEmail } =
		useAuth();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting }
	} = useForm<z.infer<typeof signUpSchema>>({
		resolver: zodResolver(signUpSchema)
	});

	const {
		handleSubmit: handleSubmitCode,
		watch: watchCode,
		setValue,
		formState: { errors: codeErrors, isSubmitting: isCodeSubmitting }
	} = useForm<z.infer<typeof verifyEmailSchema>>({
		resolver: zodResolver(verifyEmailSchema)
	});

	const code = watchCode('code');

	const onVerify = async (data: z.infer<typeof verifyEmailSchema>) => {
		await verifyEmail(data);
	};

	const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
		await signUpWithEmail(data);
	};

	if (isVerifying) {
		return (
			<form onSubmit={handleSubmitCode(onVerify)}>
				<Card className="w-[350px]">
					<CardHeader>
						<CardTitle>Verification Code </CardTitle>
					</CardHeader>
					<CardContent>
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<div className="grid gap-2">
							<Label htmlFor="code">Code</Label>
							<InputOTP
								maxLength={6}
								value={code}
								onChange={(value) => setValue('code', value)}
							>
								<InputOTPGroup>
									<InputOTPSlot index={0} />
									<InputOTPSlot index={1} />
									<InputOTPSlot index={2} />
								</InputOTPGroup>
								<InputOTPSeparator />
								<InputOTPGroup>
									<InputOTPSlot index={3} />
									<InputOTPSlot index={4} />
									<InputOTPSlot index={5} />
								</InputOTPGroup>
							</InputOTP>
							<ErrorMessage message={codeErrors.code?.message} />
						</div>
					</CardContent>
					<CardFooter>
						<Button
							type="submit"
							className="w-full"
							disabled={isCodeSubmitting}
						>
							Verify
						</Button>
					</CardFooter>
				</Card>
			</form>
		);
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
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
				<Label htmlFor="name">Name</Label>
				<Input id="name" placeholder="John" {...register('name')} />
				<ErrorMessage message={errors.name?.message} />
			</div>
			<div className="grid gap-2">
				<Label htmlFor="lastName">Last Name</Label>
				<Input id="lastName" placeholder="Doe" {...register('lastName')} />
				<ErrorMessage message={errors.lastName?.message} />
			</div>
			<div className="grid gap-2">
				<Label htmlFor="password">Password</Label>
				<PasswordInput
					id="password"
					placeholder="***********"
					showPasswordToggle={true}
					{...register('password')}
				/>
				<ErrorMessage message={errors.password?.message} />
			</div>
			<div className="grid gap-2">
				<Label htmlFor="confirmPassword">Confirm Password</Label>
				<PasswordInput
					id="confirmPassword"
					placeholder="***********"
					showPasswordToggle={true}
					{...register('confirmPassword')}
				/>
				<ErrorMessage message={errors.confirmPassword?.message} />
			</div>
			<div className="mt-4 space-y-2">
				<Button type="submit" className="w-full" disabled={isSubmitting}>
					{isSubmitting ? 'Signing up...' : 'Sign Up'}
				</Button>
				<Button
					onClick={signInWithGoogle}
					variant="outline"
					className="flex w-full items-center justify-center gap-2"
					type="button"
				>
					<GoogleIcon className="h-5 w-5" />
					Sign Up with Google
				</Button>
			</div>
		</form>
	);
}
