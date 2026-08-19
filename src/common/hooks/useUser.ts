import { api } from '~/trpc/react';
import { getUserPreviewProfile } from '~/features/userPreview/userPreview';
import { useUserPreview } from '~/features/userPreview/UserPreviewProvider';

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
		userCredits: previewProfile?.credits ?? userCreditsQuery.data?.credits ?? 0,
		userHasMentorship:
			previewProfile?.hasMentorship ??
			userMentorshipQuery.data?.mentorshipStatus === 'ACTIVE',
		isUserCreditsLoading: !mode && userCreditsQuery.isLoading,
		isUserCreditsError: !mode && userCreditsQuery.isError,
		isUserMentorshipLoading: !mode && userMentorshipQuery.isLoading
	};
}
