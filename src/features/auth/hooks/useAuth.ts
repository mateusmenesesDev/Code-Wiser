import { useClerk, useSignIn, useSignUp, useUser } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { useState } from 'react';
import type { z } from 'zod';
import type {
	resetPasswordSchema,
	signInSchema,
	signUpSchema,
	verifyEmailSchema
} from '~/features/schemas/auth.schema';
import { api } from '~/trpc/react';
import { authErrors } from '../authErrors';

export const useAuth = () => {
	const { user } = useUser();
	const { signIn, isLoaded, setActive } = useSignIn();
	const { signOut: signOutClerk } = useClerk();

	const {
		signUp,
		isLoaded: isLoadedSignUp,
		setActive: setActiveSignUp
	} = useSignUp();
	const [error, setError] = useState<string | null>(null);
	const [isVerifying, setIsVerifying] = useState(false);
	const createUserMutation = api.user.create.useMutation();

	const handleClerkError = (err: unknown) => {
		if (!isClerkAPIResponseError(err)) {
			console.error('Error during authentication:', err);
			setError(authErrors.default);
			return;
		}

		const errorCode = err.errors[0]?.code as keyof typeof authErrors;
		const errorMessage = authErrors[errorCode] || authErrors.default;
		setError(errorMessage);
	};

	const signInWithEmail = async (data: z.infer<typeof signInSchema>) => {
		if (!isLoaded) return;

		try {
			const result = await signIn.create({
				identifier: data.email,
				password: data.password
			});

			if (result.status === 'complete') {
				await setActive({ session: result.createdSessionId });
				return;
			}
			setError('Sign in failed. Please try again.');
			return;
		} catch (err) {
			handleClerkError(err);
		}
	};

	const signUpWithEmail = async (data: z.infer<typeof signUpSchema>) => {
		if (!isLoadedSignUp) return;

		try {
			await signUp.create({
				emailAddress: data.email,
				password: data.password,
				firstName: data.name,
				lastName: data.lastName
			});

			await signUp.prepareEmailAddressVerification({
				strategy: 'email_code'
			});

			setIsVerifying(true);
		} catch (err) {
			handleClerkError(err);
		}
	};

	const verifyEmail = async (data: z.infer<typeof verifyEmailSchema>) => {
		if (!isLoadedSignUp) return;

		try {
			const { status, emailAddress, createdSessionId, createdUserId } =
				await signUp.attemptEmailAddressVerification({
					code: data.code
				});

			if (!createdUserId || !emailAddress) {
				setError('Sign in failed. Please try again.');
				return;
			}

			if (status === 'complete') {
				await setActiveSignUp({ session: createdSessionId });
				await createUserMutation.mutateAsync({
					email: emailAddress,
					id: createdUserId
				});
				return;
			}
			setError('Sign in failed. Please try again.');
			return;
		} catch (err) {
			handleClerkError(err);
		}
	};

	const signInWithGoogle = async () => {
		if (!isLoaded) return;
		try {
			return await signIn.authenticateWithRedirect({
				strategy: 'oauth_google',
				redirectUrl: '/sso-callback',
				redirectUrlComplete: '/'
			});
		} catch (err) {
			handleClerkError(err);
		}
	};

	const forgotPassword = async (email: string) => {
		if (!isLoaded) return;

		try {
			await signIn.create({
				identifier: email,
				strategy: 'reset_password_email_code'
			});

			setIsVerifying(true);
		} catch (err) {
			handleClerkError(err);
		}
	};

	const resetPassword = async (data: z.infer<typeof resetPasswordSchema>) => {
		if (!isLoaded) return;

		try {
			const result = await signIn.attemptFirstFactor({
				code: data.code,
				password: data.password,
				strategy: 'reset_password_email_code'
			});

			if (result.status === 'complete') {
				await setActive({ session: result.createdSessionId });
				return;
			}

			setError('Sign in failed. Please try again.');
			return;
		} catch (err) {
			handleClerkError(err);
		}
	};

	const signOut = async () => {
		await signOutClerk();
	};

	return {
		signInWithEmail,
		signInWithGoogle,
		error,
		signUpWithEmail,
		verifyEmail,
		isVerifying,
		forgotPassword,
		resetPassword,
		user,
		signOut
	};
};
