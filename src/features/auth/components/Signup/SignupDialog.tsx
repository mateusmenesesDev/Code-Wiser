import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@radix-ui/react-label';
import { UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { GoogleIcon } from '~/common/components/icons/GoogleIcon';
import { Alert, AlertDescription } from '~/common/components/ui/alert';
import { Button } from '~/common/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Input, PasswordInput } from '~/common/components/ui/input';
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot
} from '~/common/components/ui/input-otp';
import { useDialog } from '~/common/hooks/useDialog';
import { useAuth } from '~/features/auth/hooks/useAuth';
import {
	signUpSchema,
	verifyEmailSchema
} from '~/features/schemas/auth.schema';

const SignUpDialog = () => {
	const { isDialogOpen, closeDialog, openDialog } = useDialog('signUp');
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
		closeDialog();
	};

	const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
		await signUpWithEmail(data);
	};

	const handleGoogleSignIn = () => {
		signInWithGoogle();
		closeDialog();
	};

	return (
		<Dialog open={isDialogOpen} onOpenChange={closeDialog}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<UserPlus className="h-5 w-5" />
						{isVerifying ? 'Verify Your Email' : 'Create Account'}
					</DialogTitle>
					<DialogDescription>
						{isVerifying
							? 'Enter the verification code sent to your email'
							: 'Create your account to start your learning journey'}
					</DialogDescription>
				</DialogHeader>

				{isVerifying ? (
					<form onSubmit={handleSubmitCode(onVerify)} className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<div className="space-y-2">
							<Label htmlFor="code">Verification Code</Label>
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
						<Button
							type="submit"
							className="w-full"
							disabled={isCodeSubmitting}
						>
							{isCodeSubmitting ? 'Verifying...' : 'Verify Email'}
						</Button>
					</form>
				) : (
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="Enter your email"
								{...register('email')}
							/>
							<ErrorMessage message={errors.email?.message} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								placeholder="Enter your first name"
								{...register('name')}
							/>
							<ErrorMessage message={errors.name?.message} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Last Name</Label>
							<Input
								id="lastName"
								placeholder="Enter your last name"
								{...register('lastName')}
							/>
							<ErrorMessage message={errors.lastName?.message} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<PasswordInput
								id="password"
								placeholder="Create a strong password"
								showPasswordToggle={true}
								{...register('password')}
							/>
							<ErrorMessage message={errors.password?.message} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm Password</Label>
							<PasswordInput
								id="confirmPassword"
								placeholder="Confirm your password"
								showPasswordToggle={true}
								{...register('confirmPassword')}
							/>
							<ErrorMessage message={errors.confirmPassword?.message} />
						</div>
						<div className="space-y-2">
							<Button type="submit" className="w-full" disabled={isSubmitting}>
								{isSubmitting ? 'Creating Account...' : 'Create Account'}
							</Button>
							<Button
								onClick={handleGoogleSignIn}
								variant="outline"
								className="w-full"
								type="button"
							>
								<GoogleIcon className="mr-2 h-4 w-4" />
								Sign up with Google
							</Button>
						</div>
						<div className="text-center text-sm">
							<span className="text-muted-foreground">
								Already have an account?{' '}
							</span>
							<Button
								variant="link"
								onClick={() => {
									closeDialog();
									openDialog('signIn');
								}}
								className="h-auto p-0 text-primary hover:underline"
							>
								Sign in
							</Button>
						</div>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default SignUpDialog;
