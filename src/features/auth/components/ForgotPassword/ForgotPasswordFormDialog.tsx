import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { Alert, AlertDescription } from '~/common/components/ui/alert';
import { Button } from '~/common/components/ui/button';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { forgotPasswordSchema } from '~/features/schemas/auth.schema';

interface ForgotPasswordFormDialogProps {
	onBack: () => void;
	onSuccess: (email: string) => void;
	timeToResend: number;
}

export function ForgotPasswordFormDialog({
	onBack,
	onSuccess,
	timeToResend
}: ForgotPasswordFormDialogProps) {
	const { forgotPassword, error } = useAuth();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting }
	} = useForm<z.infer<typeof forgotPasswordSchema>>({
		resolver: zodResolver(forgotPasswordSchema)
	});

	const handleForgotPassword = async (
		data: z.infer<typeof forgotPasswordSchema>
	) => {
		await forgotPassword(data.email);
		onSuccess(data.email);
	};

	return (
		<form onSubmit={handleSubmit(handleForgotPassword)} className="space-y-4">
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<div className="space-y-2">
				<Label htmlFor="forgot-email" className="flex items-center">
					<Mail className="mr-2 h-4 w-4" />
					Email
				</Label>
				<Input
					id="forgot-email"
					type="email"
					placeholder="Enter your email"
					{...register('email')}
				/>
				<ErrorMessage message={errors.email?.message} />
			</div>
			<Button
				type="submit"
				className="w-full"
				disabled={isSubmitting || timeToResend > 0}
			>
				{isSubmitting
					? 'Sending...'
					: timeToResend > 0
						? `Resend in ${timeToResend}s`
						: 'Send Reset Link'}
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
