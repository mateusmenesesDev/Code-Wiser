'use client';

import { ArrowLeft, Check, CreditCard, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { api } from '~/trpc/react';

export default function ProjectInvitationPage() {
	const router = useRouter();
	const params = useParams();
	const invitationId = params.id as string;
	const utils = api.useUtils();

	const { data: invitation, isLoading } =
		api.project.getMyProjectInvitation.useQuery({ invitationId });
	const { data: credits } = api.user.getCredits.useQuery();

	const acceptInvitation = api.project.acceptProjectInvitation.useMutation({
		onSuccess: async (result) => {
			if (!result.accepted) {
				toast.error('Not enough credits. Invitation is still pending.');
				await utils.project.getMyProjectInvitation.invalidate({ invitationId });
				return;
			}

			await Promise.all([
				utils.project.getMyProjectInvitation.invalidate({ invitationId }),
				utils.project.getMyPendingInvitations.invalidate(),
				utils.project.getEnrolled.invalidate(),
				utils.user.getCredits.invalidate()
			]);
			toast.success('Project invitation accepted');
			router.push(`/workspace/${result.projectId}`);
		},
		onError: (error) =>
			toast.error(error.message ?? 'Failed to accept invitation')
	});

	const declineInvitation = api.project.declineProjectInvitation.useMutation({
		onSuccess: async () => {
			await Promise.all([
				utils.project.getMyProjectInvitation.invalidate({ invitationId }),
				utils.project.getMyPendingInvitations.invalidate()
			]);
			toast.success('Project invitation declined');
			router.push('/my-projects');
		},
		onError: (error) =>
			toast.error(error.message ?? 'Failed to decline invitation')
	});

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<Card>
					<CardContent className="p-8 text-center text-muted-foreground">
						Loading invitation...
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!invitation) {
		return (
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<Card>
					<CardContent className="space-y-4 p-8 text-center">
						<p className="font-medium">Invitation not found</p>
						<Button asChild variant="outline">
							<Link href="/my-projects">Back to My Projects</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const creditCost = invitation.creditCostSnapshot ?? 0;
	const currentCredits = credits?.credits ?? 0;
	const hasEnoughCredits = currentCredits >= creditCost;
	const isPending = invitation.status === 'PENDING';

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<Button asChild variant="ghost" className="mb-4">
				<Link href="/my-projects">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to My Projects
				</Link>
			</Button>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-3">
						<div>
							<CardTitle>Project invitation</CardTitle>
							<CardDescription>
								Review this invitation before credits are deducted.
							</CardDescription>
						</div>
						<Badge variant={isPending ? 'warning' : 'secondary'}>
							{invitation.status}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<h1 className="font-bold text-2xl">{invitation.project.title}</h1>
						<p className="text-muted-foreground text-sm">
							{invitation.project.description}
						</p>
						<p className="text-muted-foreground text-sm">
							Invited by{' '}
							{invitation.invitedBy.name ?? invitation.invitedBy.email}
						</p>
					</div>

					<div className="rounded-lg border p-4">
						<div className="flex items-center gap-2 font-medium">
							<CreditCard className="h-4 w-4" />
							Credit cost
						</div>
						<p className="mt-2 text-sm">
							Accepting this invitation deducts{' '}
							<span className="font-semibold">{creditCost} credits</span> from
							your balance.
						</p>
						<p className="mt-1 text-muted-foreground text-sm">
							Current balance: {currentCredits} credits
						</p>
						{isPending && !hasEnoughCredits && (
							<p className="mt-2 text-destructive text-sm">
								You need more credits to accept this invitation. It will stay
								pending.
							</p>
						)}
					</div>

					{isPending ? (
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => declineInvitation.mutate({ invitationId })}
								disabled={
									declineInvitation.isPending || acceptInvitation.isPending
								}
							>
								<X className="mr-2 h-4 w-4" />
								Decline
							</Button>
							<Button
								onClick={() => acceptInvitation.mutate({ invitationId })}
								disabled={
									acceptInvitation.isPending || declineInvitation.isPending
								}
							>
								<Check className="mr-2 h-4 w-4" />
								Accept
							</Button>
						</div>
					) : (
						<Button asChild>
							<Link href="/my-projects">Return to My Projects</Link>
						</Button>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
