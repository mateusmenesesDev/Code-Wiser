'use client';

import { ProjectMethodologyEnum } from '@prisma/client';
import {
	AlertTriangle,
	Kanban,
	LayoutList,
	Search,
	Trash2,
	UserPlus,
	X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Checkbox } from '~/common/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import { Textarea } from '~/common/components/ui/textarea';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '~/common/components/ui/tooltip';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';

interface ProjectSettingsModalProps {
	projectId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ProjectSettingsModal({
	projectId,
	open,
	onOpenChange
}: ProjectSettingsModalProps) {
	const utils = api.useUtils();

	const { data: projectInfo } = api.project.getWorkspaceInfo.useQuery(
		{ id: projectId },
		{ enabled: open }
	);
	const { data: memberManagement } = api.project.getMemberManagement.useQuery(
		{ projectId },
		{ enabled: open }
	);

	const canManageMembers = memberManagement?.canManage === true;
	const needsCreditCost =
		canManageMembers &&
		memberManagement.accessType === 'CREDITS' &&
		memberManagement.creditCost === null;

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [methodology, setMethodology] = useState<ProjectMethodologyEnum>(
		ProjectMethodologyEnum.SCRUM
	);
	const [memberSearch, setMemberSearch] = useState('');
	const [creditCost, setCreditCost] = useState('');
	const [memberPendingRemoval, setMemberPendingRemoval] = useState<{
		id: string;
		name: string | null;
		email: string;
		assignedTaskCount: number;
		refundableCredits: number;
		refundUnavailableReason: string | null;
	} | null>(null);
	const [refundRemovedMemberCredits, setRefundRemovedMemberCredits] =
		useState(false);
	const [removalReason, setRemovalReason] = useState('');

	const { data: memberCandidates = [] } =
		api.project.searchProjectMemberCandidates.useQuery(
			{ projectId, search: memberSearch },
			{ enabled: open && canManageMembers }
		);

	useEffect(() => {
		if (projectInfo) {
			setTitle(projectInfo.title);
			setDescription(projectInfo.description ?? '');
			setMethodology(projectInfo.methodology);
		}
	}, [projectInfo]);

	const updateProject = api.project.updateProject.useMutation({
		onSuccess: async () => {
			await utils.project.getWorkspaceInfo.invalidate({ id: projectId });
			toast.success('Project settings saved');
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message ?? 'Failed to save settings');
		}
	});

	const addMember = api.project.addProjectMember.useMutation({
		onSuccess: async (result) => {
			setMemberSearch('');
			await Promise.all([
				utils.project.getMemberManagement.invalidate({ projectId }),
				utils.project.searchProjectMemberCandidates.invalidate(),
				utils.project.getMembers.invalidate({ projectId }),
				utils.project.getWorkspaceInfo.invalidate({ id: projectId })
			]);
			const action =
				result.kind === 'invited' ? 'Invitation sent' : 'Member added';
			toast.success(
				result.overMaxParticipants
					? `${action}. Project is over max participants.`
					: action
			);
		},
		onError: (error) => {
			toast.error(error.message ?? 'Failed to add member');
		}
	});

	const removeMember = api.project.removeProjectMember.useMutation({
		onSuccess: async (result) => {
			setMemberPendingRemoval(null);
			setRefundRemovedMemberCredits(false);
			setRemovalReason('');
			await Promise.all([
				utils.project.getMemberManagement.invalidate({ projectId }),
				utils.project.searchProjectMemberCandidates.invalidate(),
				utils.project.getMembers.invalidate({ projectId }),
				utils.project.getWorkspaceInfo.invalidate({ id: projectId })
			]);
			toast.success(
				result.refundedCredits
					? `Member removed. ${result.refundedCredits} credits refunded.`
					: 'Member removed'
			);
		},
		onError: (error) => {
			toast.error(error.message ?? 'Failed to remove member');
		}
	});

	const cancelInvitation = api.project.cancelProjectInvitation.useMutation({
		onSuccess: async () => {
			await Promise.all([
				utils.project.getMemberManagement.invalidate({ projectId }),
				utils.project.searchProjectMemberCandidates.invalidate()
			]);
			toast.success('Invitation canceled');
		},
		onError: (error) => {
			toast.error(error.message ?? 'Failed to cancel invitation');
		}
	});

	const handleSave = () => {
		updateProject.mutate({ id: projectId, title, description, methodology });
	};

	const handleAddMember = (userId: string) => {
		const parsedCreditCost = Number(creditCost);
		addMember.mutate({
			projectId,
			userId,
			...(needsCreditCost ? { creditCost: parsedCreditCost } : {})
		});
	};

	const handleRemoveMember = (member: {
		id: string;
		name: string | null;
		email: string;
		assignedTaskCount: number;
		refundableCredits: number;
		refundUnavailableReason: string | null;
	}) => {
		setMemberPendingRemoval(member);
		setRefundRemovedMemberCredits(false);
		setRemovalReason('');
	};

	const confirmRemoveMember = () => {
		if (!memberPendingRemoval) {
			return;
		}

		removeMember.mutate({
			projectId,
			userId: memberPendingRemoval.id,
			refundCredits: refundRemovedMemberCredits,
			...(removalReason.trim() ? { reason: removalReason.trim() } : {})
		});
	};

	const hasValidCreditCost =
		!needsCreditCost ||
		(Number.isInteger(Number(creditCost)) && Number(creditCost) > 0);
	const isRemovingLastMember =
		memberManagement?.canManage === true &&
		memberPendingRemoval !== null &&
		memberManagement.members.length === 1;
	const isRemovingSelf =
		memberManagement?.canManage === true &&
		memberPendingRemoval !== null &&
		memberManagement.currentUserId === memberPendingRemoval.id;

	const methodologyOptions = [
		{
			value: ProjectMethodologyEnum.SCRUM,
			label: 'Scrum',
			description:
				'Work in sprints with a backlog, sprint planning, and velocity tracking.',
			icon: LayoutList
		},
		{
			value: ProjectMethodologyEnum.KANBAN,
			label: 'Kanban',
			description:
				'Continuous flow board without sprints. All tasks are visible at once.',
			icon: Kanban,
			warning:
				'Switching to Kanban hides sprint navigation. No data is deleted.'
		}
	];

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Project Settings</DialogTitle>
						<DialogDescription>
							Update your project's view type and general information.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6 py-2">
						<div className="space-y-3">
							<Label className="font-semibold text-sm">View Type</Label>
							<div className="grid grid-cols-2 gap-3">
								<TooltipProvider>
									{methodologyOptions.map((option) => {
										const Icon = option.icon;
										const isSelected = methodology === option.value;
										const card = (
											<button
												key={option.value}
												type="button"
												onClick={() => setMethodology(option.value)}
												className={cn(
													'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:border-primary/60',
													isSelected
														? 'border-primary bg-primary/5 ring-1 ring-primary'
														: 'border-border bg-card'
												)}
											>
												<div className="flex items-center gap-2">
													<Icon className="h-4 w-4" />
													<span className="font-medium text-sm">
														{option.label}
													</span>
												</div>
												<p className="text-muted-foreground text-xs leading-relaxed">
													{option.description}
												</p>
											</button>
										);

										if (option.warning) {
											return (
												<Tooltip key={option.value}>
													<TooltipTrigger asChild>{card}</TooltipTrigger>
													<TooltipContent
														side="bottom"
														className="max-w-[220px] text-center text-xs"
													>
														{option.warning}
													</TooltipContent>
												</Tooltip>
											);
										}

										return card;
									})}
								</TooltipProvider>
							</div>
						</div>

						<div className="space-y-3">
							<Label className="font-semibold text-sm">General</Label>
							<div className="space-y-3">
								<div className="space-y-1.5">
									<Label
										htmlFor="project-title"
										className="text-muted-foreground text-sm"
									>
										Title
									</Label>
									<Input
										id="project-title"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="Project title"
									/>
								</div>
								<div className="space-y-1.5">
									<Label
										htmlFor="project-description"
										className="text-muted-foreground text-sm"
									>
										Description
									</Label>
									<Textarea
										id="project-description"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="Project description"
										rows={3}
										className="resize-none"
									/>
								</div>
							</div>
						</div>

						{canManageMembers && (
							<div className="space-y-4 rounded-lg border p-4">
								<div className="flex items-center justify-between gap-3">
									<div>
										<Label className="font-semibold text-sm">Members</Label>
										<p className="text-muted-foreground text-xs">
											{memberManagement.members.length}/
											{memberManagement.maxParticipants} members
											{memberManagement.accessType === 'CREDITS' &&
												` · ${memberManagement.creditCost ?? 'custom'} credits on accept`}
										</p>
									</div>
									{memberManagement.members.length >=
										memberManagement.maxParticipants && (
										<div className="flex items-center gap-1 text-amber-600 text-xs">
											<AlertTriangle className="h-4 w-4" />
											Over max allowed
										</div>
									)}
								</div>

								{needsCreditCost && (
									<div className="space-y-1.5">
										<Label htmlFor="credit-cost" className="text-sm">
											Credit cost for this invitation
										</Label>
										<Input
											id="credit-cost"
											type="number"
											min={1}
											step={1}
											value={creditCost}
											onChange={(event) => setCreditCost(event.target.value)}
											placeholder="Required for legacy credit projects"
										/>
									</div>
								)}

								<div className="space-y-2">
									<Label htmlFor="member-search" className="text-sm">
										Find user to{' '}
										{memberManagement.accessType === 'CREDITS'
											? 'invite'
											: 'add'}
									</Label>
									<div className="relative">
										<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
										<Input
											id="member-search"
											value={memberSearch}
											onChange={(event) => setMemberSearch(event.target.value)}
											placeholder="Search by name or email"
											className="pl-10"
										/>
									</div>

									<div className="grid max-h-48 gap-2 overflow-y-auto">
										{memberCandidates.map((candidate) => (
											<div
												key={candidate.id}
												className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-2 py-2 text-sm"
											>
												<div className="min-w-0">
													<p className="truncate font-medium">
														{candidate.name ?? candidate.email}
													</p>
													<p className="truncate text-muted-foreground text-xs">
														{candidate.email}
													</p>
													{candidate.disabledReason && (
														<p className="text-muted-foreground text-xs">
															{candidate.disabledReason}
														</p>
													)}
													{candidate.note && (
														<p className="text-amber-600 text-xs">
															{candidate.note}
														</p>
													)}
												</div>
												<Button
													type="button"
													size="sm"
													onClick={() => handleAddMember(candidate.id)}
													disabled={
														addMember.isPending ||
														!hasValidCreditCost ||
														candidate.disabledReason !== null
													}
												>
													<UserPlus className="mr-2 h-4 w-4" />
													{memberManagement.accessType === 'CREDITS'
														? 'Invite'
														: 'Add'}
												</Button>
											</div>
										))}
									</div>
								</div>

								<div className="space-y-2">
									<p className="font-medium text-xs">Current members</p>
									<div className="grid gap-2 text-sm">
										{memberManagement.members.map((member) => (
											<div
												key={member.id}
												className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-2 py-2"
											>
												<div className="min-w-0">
													<p className="truncate font-medium">
														{member.name ?? member.email}{' '}
														{member.id === memberManagement.currentUserId && (
															<span className="text-muted-foreground text-xs">
																(you)
															</span>
														)}
													</p>
													<p className="truncate text-muted-foreground text-xs">
														{member.email}
													</p>
													<p className="text-muted-foreground text-xs">
														{member.assignedTaskCount} assigned task
														{member.assignedTaskCount === 1 ? '' : 's'}
													</p>
													{member.refundableCredits > 0 ? (
														<p className="text-emerald-600 text-xs">
															Refund available: {member.refundableCredits}{' '}
															credits
														</p>
													) : member.refundUnavailableReason ? (
														<p className="text-muted-foreground text-xs">
															Refund unavailable:{' '}
															{member.refundUnavailableReason}
														</p>
													) : null}
												</div>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => handleRemoveMember(member)}
													disabled={removeMember.isPending}
													aria-label={`Remove ${member.name ?? member.email}`}
												>
													<Trash2 className="h-4 w-4 text-destructive" />
												</Button>
											</div>
										))}
									</div>
									<p className="text-muted-foreground text-xs">
										Removing a member unassigns their tasks. Last-member and
										self-removal are allowed after confirmation.
									</p>
								</div>

								{memberManagement.invitations.length > 0 && (
									<div className="space-y-2">
										<p className="font-medium text-xs">Invitations</p>
										<div className="grid gap-2">
											{memberManagement.invitations.map((invitation) => (
												<div
													key={invitation.id}
													className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1 text-sm"
												>
													<div>
														<div className="flex items-center gap-2">
															<span>
																{invitation.user.name ?? invitation.user.email}
															</span>
															<Badge
																variant={
																	invitation.status === 'PENDING'
																		? 'warning'
																		: 'secondary'
																}
															>
																{invitation.status}
															</Badge>
														</div>
														<span className="text-muted-foreground text-xs">
															{invitation.creditCostSnapshot ?? 0} credits ·
															invited by{' '}
															{invitation.invitedBy.name ??
																invitation.invitedBy.email}
														</span>
													</div>
													{invitation.status === 'PENDING' && (
														<Button
															type="button"
															variant="ghost"
															size="icon"
															onClick={() =>
																cancelInvitation.mutate({
																	invitationId: invitation.id
																})
															}
															disabled={cancelInvitation.isPending}
														>
															<X className="h-4 w-4" />
														</Button>
													)}
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={updateProject.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							disabled={updateProject.isPending || !title.trim()}
						>
							{updateProject.isPending ? 'Saving…' : 'Save'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={memberPendingRemoval !== null}
				onOpenChange={(nextOpen) => {
					if (!nextOpen && !removeMember.isPending) {
						setMemberPendingRemoval(null);
						setRefundRemovedMemberCredits(false);
						setRemovalReason('');
					}
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Remove project member?</DialogTitle>
						<DialogDescription>
							This removes project access and unassigns this member's tasks.
						</DialogDescription>
					</DialogHeader>

					{memberPendingRemoval && (
						<div className="space-y-4 py-2 text-sm">
							<div className="rounded-md bg-muted/50 p-3">
								<p className="font-medium">
									{memberPendingRemoval.name ?? memberPendingRemoval.email}
								</p>
								<p className="text-muted-foreground text-xs">
									{memberPendingRemoval.email}
								</p>
							</div>

							<div className="space-y-1 text-muted-foreground">
								<p>
									{memberPendingRemoval.assignedTaskCount} assigned task
									{memberPendingRemoval.assignedTaskCount === 1 ? '' : 's'} will
									be unassigned.
								</p>
								{isRemovingLastMember && (
									<p className="text-amber-600">
										This is the last project member.
									</p>
								)}
								{isRemovingSelf && (
									<p className="text-amber-600">
										You are removing yourself from this project.
									</p>
								)}
							</div>

							{memberPendingRemoval.refundableCredits > 0 ? (
								<div className="flex items-start gap-2 rounded-md border p-3">
									<Checkbox
										id="remove-member-refund"
										checked={refundRemovedMemberCredits}
										onCheckedChange={(checked) =>
											setRefundRemovedMemberCredits(checked === true)
										}
										disabled={removeMember.isPending}
									/>
									<div className="space-y-1">
										<Label htmlFor="remove-member-refund">
											Refund {memberPendingRemoval.refundableCredits} credits
										</Label>
										<p className="text-muted-foreground text-xs">
											Off by default. Enable only if this removal should return
											credits.
										</p>
									</div>
								</div>
							) : memberPendingRemoval.refundUnavailableReason ? (
								<p className="rounded-md bg-muted/50 p-3 text-muted-foreground text-xs">
									Refund unavailable:{' '}
									{memberPendingRemoval.refundUnavailableReason}.
								</p>
							) : null}

							<div className="space-y-1.5">
								<Label htmlFor="remove-member-reason">Reason (optional)</Label>
								<Textarea
									id="remove-member-reason"
									value={removalReason}
									onChange={(event) => setRemovalReason(event.target.value)}
									placeholder="Short note for audit and user notification"
									rows={3}
									maxLength={500}
									className="resize-none"
									disabled={removeMember.isPending}
								/>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setMemberPendingRemoval(null)}
							disabled={removeMember.isPending}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={confirmRemoveMember}
							disabled={removeMember.isPending || !memberPendingRemoval}
						>
							{removeMember.isPending ? 'Removing…' : 'Remove member'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
