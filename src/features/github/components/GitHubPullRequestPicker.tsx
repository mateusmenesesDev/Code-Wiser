'use client';

import { useState } from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { api } from '~/trpc/react';

type GitHubPullRequestPickerProps = {
	repositoryId: string;
	onSelect: (url: string) => void;
};

export function GitHubPullRequestPicker({
	repositoryId,
	onSelect
}: GitHubPullRequestPickerProps) {
	const [open, setOpen] = useState(false);
	const { data: pullRequests, isFetching } =
		api.github.listPullRequests.useQuery({ repositoryId }, { enabled: open });

	return (
		<div className="flex items-center gap-2">
			<Select
				open={open}
				onOpenChange={setOpen}
				onValueChange={(value) => {
					const pullRequest = pullRequests?.find(
						(item) => String(item.number) === value
					);
					if (pullRequest) onSelect(pullRequest.htmlUrl);
				}}
			>
				<SelectTrigger className="w-full">
					<SelectValue
						placeholder={
							isFetching ? 'Loading pull requests...' : 'Choose a pull request'
						}
					/>
				</SelectTrigger>
				<SelectContent>
					{(pullRequests ?? []).map((pullRequest) => (
						<SelectItem
							key={pullRequest.number}
							value={String(pullRequest.number)}
						>
							#{pullRequest.number} · {pullRequest.title}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
