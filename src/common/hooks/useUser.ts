import { api } from '~/trpc/react';

export function useUser() {
	const userCreditsQuery = api.user.getCredits.useQuery(undefined);

	const userMentorshipQuery = api.user.getMentorshipStatus.useQuery(undefined);

	return {
		userCredits: userCreditsQuery.data?.credits ?? 0,
		userHasMentorship: userMentorshipQuery.data?.mentorshipStatus === 'ACTIVE',
		isUserCreditsLoading: userCreditsQuery.isLoading,
		isUserCreditsError: userCreditsQuery.isError
	};
}
