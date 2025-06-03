import { LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { useDialog } from '~/common/hooks/useDialog';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { ForgotPasswordFormDialog } from '../ForgotPassword/ForgotPasswordFormDialog';
import { ResetPasswordFormDialog } from '../ForgotPassword/ResetPasswordFormDialog';
import { SignInForm } from './SignInForm';

type DialogMode = 'signIn' | 'forgotPassword' | 'resetPassword';

const SignInDialog = () => {
	const { isDialogOpen, closeDialog, openDialog } = useDialog('signIn');
	const [dialogMode, setDialogMode] = useState<DialogMode>('signIn');
	const [timeToResend, setTimeToResend] = useState(0);
	const [resetEmail, setResetEmail] = useState('');

	const { isVerifying, forgotPassword } = useAuth();

	useEffect(() => {
		if (isVerifying && timeToResend > 0) {
			const timer = setTimeout(() => setTimeToResend(timeToResend - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [timeToResend, isVerifying]);

	useEffect(() => {
		if (!isDialogOpen) {
			setDialogMode('signIn');
			setTimeToResend(0);
			setResetEmail('');
		}
	}, [isDialogOpen]);

	const handleForgotPasswordSuccess = (email: string) => {
		setResetEmail(email);
		setDialogMode('resetPassword');
		setTimeToResend(60);
	};

	const handleResendCode = async () => {
		setTimeToResend(60);
		await forgotPassword(resetEmail);
	};

	const getDialogContent = () => {
		switch (dialogMode) {
			case 'forgotPassword':
				return {
					title: 'Forgot Password',
					description: 'Enter your email to receive a reset link'
				};
			case 'resetPassword':
				return {
					title: 'Reset Password',
					description: 'Enter your new password and verification code'
				};
			default:
				return {
					title: 'Sign In to CodeWise',
					description:
						'Enter your credentials to access your projects and continue your learning journey.'
				};
		}
	};

	const { title, description } = getDialogContent();

	const renderForm = () => {
		switch (dialogMode) {
			case 'signIn':
				return (
					<SignInForm
						onForgotPassword={() => setDialogMode('forgotPassword')}
						onSignUpClick={() => {
							closeDialog();
							openDialog('signUp');
						}}
						onSuccess={closeDialog}
					/>
				);
			case 'forgotPassword':
				return (
					<ForgotPasswordFormDialog
						onBack={() => setDialogMode('signIn')}
						onSuccess={handleForgotPasswordSuccess}
						timeToResend={timeToResend}
					/>
				);
			case 'resetPassword':
				return (
					<ResetPasswordFormDialog
						onBack={() => setDialogMode('signIn')}
						onSuccess={closeDialog}
						onResendCode={handleResendCode}
						timeToResend={timeToResend}
						email={resetEmail}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<Dialog open={isDialogOpen} onOpenChange={closeDialog}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<LogIn className="h-5 w-5" />
						{title}
					</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				{renderForm()}
			</DialogContent>
		</Dialog>
	);
};

export default SignInDialog;
