'use client';

import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PlanningPokerRoom } from '~/features/planningPoker/components/PlanningPokerRoom';
import { api } from '~/trpc/react';

export default function PlanningPokerPage() {
	const params = useParams();
	const router = useRouter();
	const projectId = params.id as string;

	const { data: activeSession, isLoading } =
		api.planningPoker.getActiveSession.useQuery(
			{ projectId },
			{
				retry: false,
				refetchOnWindowFocus: false
			}
		);

	useEffect(() => {
		if (!isLoading && !activeSession) {
			router.push(`/workspace/${projectId}`);
		}
	}, [activeSession, isLoading, router, projectId]);

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<Loader2 className="h-8 w-8 animate-spin" />
					<p className="text-muted-foreground text-sm">Loading session...</p>
				</div>
			</div>
		);
	}

	if (!activeSession) {
		return null;
	}

	return <PlanningPokerRoom sessionId={activeSession.id} />;
}
