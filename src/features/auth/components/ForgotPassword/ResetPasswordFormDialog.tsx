import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { Alert, AlertDescription } from '~/common/components/ui/alert';
import { Button } from '~/common/components/ui/button';
import { PasswordInput } from '~/common/components/ui/input';
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot
} from '~/common/components/ui/input-otp';
import { Label } from '~/common/components/ui/label';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { resetPasswordSchema } from '~/features/schemas/auth.schema';

interface ResetPasswordFormDialogProps {
	onBack: () => void;
	onSuccess: () => void;
	onResendCode: () => void;
	timeToResend: number;
	email: string;
}

export function ResetPasswordFormDialog({
	onBack,
	onSuccess,
	onResendCode,
	timeToResend,
	email
}: ResetPasswordFormDialogProps) {
	const { resetPassword, forgotPassword, error } = useAuth();

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors, isSubmitting }
	} = useForm<z.infer<typeof resetPasswordSchema>>({
		resolver: zodResolver(resetPasswordSchema)
	});

	const code = watch('code');

	const handleResetPassword = async (
		data: z.infer<typeof resetPasswordSchema>
	) => {
		await resetPassword(data);
		onSuccess();
	};

	const handleResendCode = async () => {
		setValue('code', '');
		await forgotPassword(email);
		onResendCode();
	};

	return (
		<form onSubmit={handleSubmit(handleResetPassword)} className="space-y-4">
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<div className="space-y-2">
				<Label htmlFor="new-password">New Password</Label>
				<PasswordInput
					id="new-password"
					placeholder="Enter new password"
					showPasswordToggle={true}
					{...register('password')}
				/>
				<ErrorMessage message={errors.password?.message} />
			</div>
			<div className="space-y-2">
				<Label htmlFor="confirm-password">Confirm New Password</Label>
				<PasswordInput
					id="confirm-password"
					placeholder="Confirm new password"
					showPasswordToggle={true}
					{...register('confirmPassword')}
				/>
				<ErrorMessage message={errors.confirmPassword?.message} />
			</div>
			<div className="space-y-2">
				<Label htmlFor="reset-code">Verification Code</Label>
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
				<ErrorMessage message={errors.code?.message} />
			</div>
			<Button
				type="button"
				onClick={handleResendCode}
				variant="secondary"
				className="w-full"
				disabled={timeToResend > 0 || isSubmitting}
			>
				{timeToResend > 0 ? `Resend Code (${timeToResend}s)` : 'Resend Code'}
			</Button>
			<Button type="submit" className="w-full" disabled={isSubmitting}>
				{isSubmitting ? 'Changing Password...' : 'Change Password'}
			</Button>
			<Button
				variant="outline"
				onClick={onBack}
				className="w-full"
				type="button"
			>
				Back to Sign In
			</Button>
		</form>
	);
}
