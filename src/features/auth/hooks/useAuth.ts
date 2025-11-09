import { useClerk, useSignIn, useUser } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { useState } from 'react';
import { authErrors } from '../authErrors';

export const useAuth = () => {
	const { user } = useUser();
	const { isLoaded, signIn } = useSignIn();
	const { signOut: signOutClerk } = useClerk();

	const [error, setError] = useState<string | null>(null);

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

	const signInWithOAuth = async (strategy: 'oauth_google' | 'oauth_github') => {
		if (!isLoaded) return;
		try {
			return await signIn.authenticateWithRedirect({
				strategy,
				redirectUrl: '/sso-callback',
				redirectUrlComplete: '/'
			});
		} catch (err) {
			handleClerkError(err);
		}
	};

	const signOut = async () => {
		await signOutClerk();
	};

	return {
		signInWithOAuth,
		error,
		user,
		signOut
	};
};
