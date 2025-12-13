import { useAuth } from '~/features/auth/hooks/useAuth';
import { api } from '~/trpc/react';

export function useUser() {
	const { user } = useAuth();
	const userEmail = user?.emailAddresses[0]?.emailAddress;
	const userName = user?.fullName;

	const userCreditsQuery = api.user.getCredits.useQuery(undefined, {
		enabled: !!user
	});

	const userMentorshipQuery = api.user.getMentorshipStatus.useQuery(undefined, {
		enabled: !!user
	});

	return {
		userCredits: userCreditsQuery.data?.credits ?? 0,
		userHasMentorship: userMentorshipQuery.data?.mentorshipStatus === 'ACTIVE',
		isUserCreditsLoading: userCreditsQuery.isLoading,
		isUserCreditsError: userCreditsQuery.isError,
		userEmail,
		userName
	};
}
