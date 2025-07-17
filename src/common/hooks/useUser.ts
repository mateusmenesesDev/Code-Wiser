import { useAuth } from '~/features/auth/hooks/useAuth';
import { api } from '~/trpc/react';

export function useUser() {
	const { user } = useAuth();
	const userCreditsQuery = api.user.getCredits.useQuery(undefined, {
		enabled: !!user
	});

	return {
		userCredits: userCreditsQuery.data?.credits ?? 0,
		isUserCreditsLoading: userCreditsQuery.isLoading,
		isUserCreditsError: userCreditsQuery.isError
	};
}
