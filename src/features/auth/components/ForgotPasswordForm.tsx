'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { Alert, AlertDescription } from '~/common/components/ui/alert';
import { Button } from '~/common/components/ui/button';
import { Input, PasswordInput } from '~/common/components/ui/input';
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot
} from '~/common/components/ui/input-otp';
import { Label } from '~/common/components/ui/label';
import { useAuth } from '~/features/auth/hooks/useAuth';
import {
	forgotPasswordSchema,
	resetPasswordSchema
} from '~/features/schemas/auth.schema';

export default function ForgotPasswordForm() {
	const { error, forgotPassword, resetPassword, isVerifying } = useAuth();
	const [timeToResend, setTimeToResend] = useState(0);

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors, isSubmitting }
	} = useForm<z.infer<typeof forgotPasswordSchema>>({
		resolver: zodResolver(forgotPasswordSchema)
	});

	const {
		register: registerCode,
		handleSubmit: handleSubmitCode,
		watch: watchCode,
		setValue,
		formState: { errors: codeErrors, isSubmitting: isCodeSubmitting }
	} = useForm<z.infer<typeof resetPasswordSchema>>({
		resolver: zodResolver(resetPasswordSchema)
	});

	const code = watchCode('code');
	const email = watch('email');

	useEffect(() => {
		if (isVerifying) {
			if (timeToResend > 0) {
				const timer = setTimeout(() => setTimeToResend(timeToResend - 1), 1000);
				return () => clearTimeout(timer);
			}
		}
	}, [timeToResend, isVerifying]);

	const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
		await forgotPassword(data.email);
		setTimeToResend(60); // Set the countdown to 60 seconds after sending the email
	};

	const onVerify = async (data: z.infer<typeof resetPasswordSchema>) => {
		await resetPassword(data);
	};

	const handleResendCode = async () => {
		setValue('code', '');
		setTimeToResend(60);
		await forgotPassword(email);
	};

	if (isVerifying) {
		return (
			<form onSubmit={handleSubmitCode(onVerify)} className="space-y-4">
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				<div className="grid gap-2">
					<Label htmlFor="password">New Password</Label>
					<PasswordInput
						id="password"
						placeholder="New Password"
						showPasswordToggle={true}
						{...registerCode('password')}
					/>
					<ErrorMessage message={codeErrors.password?.message} />
				</div>
				<div className="grid gap-2">
					<Label htmlFor="confirmPassword">Confirm New Password</Label>
					<PasswordInput
						id="confirmPassword"
						placeholder="Confirm New Password"
						showPasswordToggle={true}
						{...registerCode('confirmPassword')}
					/>
					<ErrorMessage message={codeErrors.confirmPassword?.message} />
				</div>
				<div className="grid gap-2">
					<Label htmlFor="code">Verification Code</Label>
					<InputOTP
						id="code"
						maxLength={6}
						value={code}
						onChange={(value) => setValue('code', value)}
					>
						<InputOTPGroup>
							<InputOTPSlot index={0} className="sm:w-12" />
							<InputOTPSlot index={1} className="sm:w-12" />
							<InputOTPSlot index={2} className="sm:w-12" />
						</InputOTPGroup>
						<InputOTPSeparator />
						<InputOTPGroup>
							<InputOTPSlot index={3} className="sm:w-12" />
							<InputOTPSlot index={4} className="sm:w-12" />
							<InputOTPSlot index={5} className="sm:w-12" />
						</InputOTPGroup>
					</InputOTP>
					<ErrorMessage message={codeErrors.code?.message} />
				</div>
				<Button
					type="button"
					onClick={handleResendCode}
					variant="secondary"
					className="w-full"
					disabled={timeToResend > 0 || isCodeSubmitting}
				>
					{timeToResend > 0 ? `Resend Code (${timeToResend}s)` : 'Resend Code'}
				</Button>
				<Button type="submit" className="w-full" disabled={isCodeSubmitting}>
					Change Password
				</Button>
			</form>
		);
	}

	return (
		<form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<div className="space-y-1">
				<Label htmlFor="email" className="flex items-center">
					<MailIcon className="mr-2 h-4 w-4" />
					Email
				</Label>
				<Input
					id="email"
					type="email"
					placeholder="m@example.com"
					{...register('email')}
				/>
				<ErrorMessage message={errors.email?.message} />
			</div>
			<Button className="w-full" disabled={isSubmitting || timeToResend > 0}>
				{isSubmitting
					? 'Sending...'
					: timeToResend > 0
						? `Resend in ${timeToResend}s`
						: 'Send Reset Link'}
			</Button>
		</form>
	);
}
