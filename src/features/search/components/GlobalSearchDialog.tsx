'use client';

import { CheckSquare, FolderOpen, IterationCcw, Lightbulb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '~/common/components/ui/badge';
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from '~/common/components/ui/command';
import type { NavigationItem } from '~/common/constants/menuItem';
import { api } from '~/trpc/react';

const SEARCH_DELAY_MS = 250;

type SearchResult = {
	id: string;
	title: string;
	project: { id: string; title: string } | null;
};
type SearchResultType = 'project' | 'task' | 'sprint' | 'epic';

type ResultGroup = {
	type: SearchResultType;
	label: string;
	Icon: LucideIcon;
	results: SearchResult[];
};

const resultPath = (type: SearchResultType, result: SearchResult) => {
	if (type === 'project') return `/workspace/${result.id}`;

	const params = new URLSearchParams();
	if (type === 'task') {
		params.set('taskId', result.id);
	}
	if (type === 'sprint') {
		params.set('view', 'sprint');
		params.set('sprintId', result.id);
	}
	if (type === 'epic') {
		params.set('view', 'roadmap');
		params.set('epicId', result.id);
	}

	return `/workspace/${result.project?.id}?${params.toString()}`;
};

export function GlobalSearchDialog({
	open,
	onOpenChange,
	searchableItems,
	onNavigate
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	searchableItems: NavigationItem[];
	onNavigate?: () => void;
}) {
	const t = useTranslations('navigation');
	const router = useRouter();
	const [query, setQuery] = useState('');
	const [debouncedQuery, setDebouncedQuery] = useState('');

	useEffect(() => {
		const timeout = window.setTimeout(
			() => setDebouncedQuery(query.trim()),
			SEARCH_DELAY_MS
		);
		return () => window.clearTimeout(timeout);
	}, [query]);

	useEffect(() => {
		if (!open) {
			setQuery('');
			setDebouncedQuery('');
		}
	}, [open]);

	const trimmedQuery = query.trim();
	const canShowContentResults =
		trimmedQuery.length >= 2 && trimmedQuery === debouncedQuery;
	const { data, isError, isFetching } = api.search.global.useQuery(
		{ query: debouncedQuery },
		{ enabled: open && debouncedQuery.length >= 2 }
	);

	const navigationResults = useMemo(() => {
		const normalizedQuery = query.trim().toLocaleLowerCase();
		return searchableItems.filter(
			(item) =>
				!normalizedQuery ||
				t(item.labelKey).toLocaleLowerCase().includes(normalizedQuery)
		);
	}, [query, searchableItems, t]);

	const resultGroups = useMemo<ResultGroup[]>(
		() => [
			{
				type: 'project',
				label: t('searchTypeProject'),
				Icon: FolderOpen,
				results:
					canShowContentResults && !isError
						? ((data?.projects ?? []) as SearchResult[])
						: []
			},
			{
				type: 'task',
				label: t('searchTypeTask'),
				Icon: CheckSquare,
				results:
					canShowContentResults && !isError
						? ((data?.tasks ?? []) as SearchResult[])
						: []
			},
			{
				type: 'sprint',
				label: t('searchTypeSprint'),
				Icon: IterationCcw,
				results:
					canShowContentResults && !isError
						? ((data?.sprints ?? []) as SearchResult[])
						: []
			},
			{
				type: 'epic',
				label: t('searchTypeEpic'),
				Icon: Lightbulb,
				results:
					canShowContentResults && !isError
						? ((data?.epics ?? []) as SearchResult[])
						: []
			}
		],
		[canShowContentResults, data, isError, t]
	);
	const hasContentResults = resultGroups.some(
		(group) => group.results.length > 0
	);
	const hasResults = navigationResults.length > 0 || hasContentResults;

	const navigateFromSearch = (href: string) => {
		onOpenChange(false);
		onNavigate?.();
		router.push(href);
	};

	return (
		<CommandDialog open={open} onOpenChange={onOpenChange}>
			<CommandInput
				value={query}
				onValueChange={setQuery}
				placeholder={t('searchEverything')}
			/>
			<CommandList>
				{navigationResults.length > 0 && (
					<CommandGroup heading={t('navigationGroup')}>
						{navigationResults.map((item) => {
							const Icon = item.Icon;
							return (
								<CommandItem
									key={item.href}
									onSelect={() => navigateFromSearch(item.href)}
									value={t(item.labelKey)}
								>
									<Icon className="mr-2 h-4 w-4" aria-hidden="true" />
									{t(item.labelKey)}
								</CommandItem>
							);
						})}
					</CommandGroup>
				)}

				{resultGroups.map((group) => {
					if (group.results.length === 0) return null;
					return (
						<CommandGroup key={group.type} heading={group.label}>
							{group.results.map((result) => (
								<CommandItem
									key={`${group.type}-${result.id}`}
									onSelect={() =>
										navigateFromSearch(resultPath(group.type, result))
									}
									value={`${query} ${result.title} ${group.label} ${result.project?.title ?? ''}`}
								>
									<group.Icon
										className="mr-2 h-4 w-4 shrink-0"
										aria-hidden="true"
									/>
									<div className="min-w-0 flex-1">
										<div className="truncate font-medium">{result.title}</div>
										{result.project && (
											<div className="truncate text-muted-foreground text-xs">
												{t('searchInProject')}: {result.project.title}
											</div>
										)}
									</div>
									<Badge variant="outline" className="ml-2 shrink-0">
										{group.label}
									</Badge>
								</CommandItem>
							))}
						</CommandGroup>
					);
				})}

				{(isFetching ||
					(trimmedQuery.length >= 2 && trimmedQuery !== debouncedQuery)) && (
					<div className="px-4 py-3 text-center text-muted-foreground text-sm">
						{t('searchLoading')}
					</div>
				)}
				{!isFetching && isError && canShowContentResults && (
					<div className="px-4 py-3 text-center text-destructive text-sm">
						{t('searchError')}
					</div>
				)}
				{!isFetching &&
					!isError &&
					trimmedQuery === debouncedQuery &&
					trimmedQuery.length >= 2 &&
					!hasResults && <CommandEmpty>{t('searchNoResults')}</CommandEmpty>}
				{trimmedQuery.length === 1 && !hasResults && (
					<CommandEmpty>{t('searchStartTyping')}</CommandEmpty>
				)}
			</CommandList>
		</CommandDialog>
	);
}
