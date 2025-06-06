import { api } from '~/trpc/react';

export function useUser() {
	const userCreditsQuery = api.user.getCredits.useQuery();

	return {
		userCredits: userCreditsQuery.data?.credits ?? 0,
		isUserCreditsLoading: userCreditsQuery.isLoading,
		isUserCreditsError: userCreditsQuery.isError
	};
}
