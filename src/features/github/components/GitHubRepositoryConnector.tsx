'use client';

import { GitBranch, Unlink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { api } from '~/trpc/react';

type Repository = {
	fullName: string;
	htmlUrl: string;
};

type GitHubRepositoryConnectorProps = {
	projectId?: string;
	trackId?: string;
	currentRepository?: Repository | null;
	returnTo: string;
};

export function GitHubRepositoryConnector({
	projectId,
	trackId,
	currentRepository,
	returnTo
}: GitHubRepositoryConnectorProps) {
	const utils = api.useUtils();
	const { data: connection } = api.github.getConnection.useQuery();
	const [installationId, setInstallationId] = useState('');
	const selectedInstallation = connection?.installations.find(
		(installation) => installation.id === installationId
	);
	const { data: repositories, isFetching: isLoadingRepositories } =
		api.github.listRepositories.useQuery(
			{ installationId },
			{ enabled: Boolean(installationId) }
		);

	useEffect(() => {
		if (!installationId && connection?.installations[0]) {
			setInstallationId(connection.installations[0].id);
		}
	}, [connection?.installations, installationId]);

	const linkProject = api.github.linkProjectRepository.useMutation({
		onSuccess: async () => {
			toast.success('GitHub repository linked');
			await Promise.all([
				utils.github.getConnection.invalidate(),
				projectId
					? utils.project.getWorkspaceInfo.invalidate({ id: projectId })
					: Promise.resolve()
			]);
		},
		onError: (error) => toast.error(error.message)
	});
	const linkTrack = api.github.linkExerciseTrackRepository.useMutation({
		onSuccess: async () => {
			toast.success('GitHub repository linked');
			await utils.github.getConnection.invalidate();
		},
		onError: (error) => toast.error(error.message)
	});
	const unlinkProject = api.github.unlinkProjectRepository.useMutation({
		onSuccess: async () => {
			toast.success('GitHub repository unlinked');
			await Promise.all([
				utils.github.getConnection.invalidate(),
				projectId
					? utils.project.getWorkspaceInfo.invalidate({ id: projectId })
					: Promise.resolve()
			]);
		},
		onError: (error) => toast.error(error.message)
	});
	const unlinkTrack = api.github.unlinkExerciseTrackRepository.useMutation({
		onSuccess: async () => {
			toast.success('GitHub repository unlinked');
			await utils.github.getConnection.invalidate();
		},
		onError: (error) => toast.error(error.message)
	});

	const isPending =
		linkProject.isPending ||
		linkTrack.isPending ||
		unlinkProject.isPending ||
		unlinkTrack.isPending;
	const linkRepository = (fullName: string) => {
		if (projectId) {
			linkProject.mutate({ projectId, installationId, fullName });
		} else if (trackId) {
			linkTrack.mutate({ trackId, installationId, fullName });
		}
	};

	return (
		<div className="space-y-3 rounded-lg border p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<div className="flex items-center gap-2 font-semibold text-sm">
						<GitBranch className="h-4 w-4" />
						GitHub repository
					</div>
					<p className="mt-1 text-muted-foreground text-xs">
						Link a repository to validate pull requests and receive updates from
						GitHub.
					</p>
				</div>
				{currentRepository && (
					<Button
						variant="ghost"
						size="sm"
						disabled={isPending}
						onClick={() =>
							projectId
								? unlinkProject.mutate({ projectId })
								: trackId
									? unlinkTrack.mutate({ trackId })
									: undefined
						}
					>
						<Unlink className="mr-1 h-3.5 w-3.5" />
						Unlink
					</Button>
				)}
			</div>

			{currentRepository && (
				<p className="text-sm">
					Linked:{' '}
					<a
						href={currentRepository.htmlUrl}
						target="_blank"
						rel="noreferrer"
						className="underline"
					>
						{currentRepository.fullName}
					</a>
				</p>
			)}

			{!connection?.configured ? (
				<p className="text-muted-foreground text-xs">
					The GitHub App is not configured for this environment.
				</p>
			) : connection.installations.length === 0 ? (
				<Button asChild variant="outline" size="sm">
					<a
						href={`/api/github/install?returnTo=${encodeURIComponent(returnTo)}`}
					>
						Connect GitHub
					</a>
				</Button>
			) : (
				<div className="space-y-3">
					<Select value={installationId} onValueChange={setInstallationId}>
						<SelectTrigger>
							<SelectValue placeholder="Choose a GitHub account" />
						</SelectTrigger>
						<SelectContent>
							{connection.installations.map((installation) => (
								<SelectItem key={installation.id} value={installation.id}>
									{installation.accountLogin} ({installation.accountType})
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{selectedInstallation && (
						<Select onValueChange={linkRepository}>
							<SelectTrigger>
								<SelectValue
									placeholder={
										isLoadingRepositories
											? 'Loading repositories...'
											: 'Choose a repository'
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{(repositories ?? []).map((repository) => (
									<SelectItem
										key={repository.fullName}
										value={repository.fullName}
									>
										{repository.fullName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</div>
			)}
		</div>
	);
}
