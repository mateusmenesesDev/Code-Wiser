import { useUserPreview } from '~/features/userPreview/UserPreviewProvider';
import { getUserPreviewProfile } from '~/features/userPreview/userPreview';
import { api } from '~/trpc/react';

export function useUser() {
	const { mode } = useUserPreview();
	const userCreditsQuery = api.user.getCredits.useQuery(undefined, {
		enabled: !mode
	});
	const userMentorshipQuery = api.user.getMentorshipStatus.useQuery(undefined, {
		enabled: !mode
	});
	const previewProfile = mode ? getUserPreviewProfile(mode) : null;

	return {
		userCredits: mode
			? (previewProfile?.credits ?? 0)
			: (userCreditsQuery.data?.credits ?? 0),
		userHasMentorship: mode
			? (previewProfile?.hasMentorship ?? false)
			: userMentorshipQuery.data?.mentorshipStatus === 'ACTIVE',
		isUserCreditsLoading: !mode && userCreditsQuery.isLoading,
		isUserCreditsError: !mode && userCreditsQuery.isError,
		isUserMentorshipLoading: !mode && userMentorshipQuery.isLoading
	};
}
