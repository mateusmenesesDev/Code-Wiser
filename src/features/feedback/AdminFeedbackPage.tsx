'use client';

import { ExternalLink, ImageIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '~/common/components/ui/badge';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Input } from '~/common/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';
import { api } from '~/trpc/react';

const statusLabels = {
	OPEN: 'Open',
	IN_REVIEW: 'In Review',
	RESOLVED: 'Resolved',
	DISMISSED: 'Dismissed'
} as const;

const typeLabels = {
	BUG: 'Bug',
	SUGGESTION: 'Suggestion',
	QUESTION: 'Question',
	OTHER: 'Other'
} as const;

export function AdminFeedbackPage() {
	const searchParams = useSearchParams();
	const initialReportId = searchParams.get('reportId');
	const [status, setStatus] = useState<string>('ALL');
	const [type, setType] = useState<string>('ALL');
	const [search, setSearch] = useState('');
	const [selectedId, setSelectedId] = useState<string | null>(initialReportId);
	const utils = api.useUtils();

	const listInput = useMemo(
		() => ({
			status:
				status === 'ALL' ? undefined : (status as keyof typeof statusLabels),
			type: type === 'ALL' ? undefined : (type as keyof typeof typeLabels),
			search: search.trim() || undefined,
			take: 50
		}),
		[status, type, search]
	);

	const { data, isLoading } = api.feedback.list.useQuery(listInput);
	const { data: selectedReport } = api.feedback.getById.useQuery(
		selectedId ?? '',
		{
			enabled: !!selectedId
		}
	);
	const updateStatus = api.feedback.updateStatus.useMutation({
		onSuccess: async () => {
			await Promise.all([
				utils.feedback.list.invalidate(),
				utils.feedback.getById.invalidate(selectedId ?? '')
			]);
		}
	});

	useEffect(() => {
		if (!selectedId && data?.reports[0]) {
			setSelectedId(data.reports[0].id);
		}
	}, [selectedId, data]);

	return (
		<div className="container mx-auto space-y-6 px-4 py-8">
			<div>
				<h1 className="font-bold text-3xl">Feedback Inbox</h1>
				<p className="text-muted-foreground">
					Review user feedback and bug reports.
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
				<Card>
					<CardHeader className="space-y-4">
						<CardTitle>Reports</CardTitle>
						<div className="grid gap-3 md:grid-cols-[160px_160px_minmax(0,1fr)]">
							<Select value={status} onValueChange={setStatus}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">All statuses</SelectItem>
									{Object.entries(statusLabels).map(([value, label]) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select value={type} onValueChange={setType}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">All types</SelectItem>
									{Object.entries(typeLabels).map(([value, label]) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Input
								placeholder="Search title, description, or reporter..."
								value={search}
								onChange={(event) => setSearch(event.target.value)}
							/>
						</div>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Report</TableHead>
									<TableHead>Reporter</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={4}>Loading...</TableCell>
									</TableRow>
								) : data?.reports.length ? (
									data.reports.map((report) => (
										<TableRow
											key={report.id}
											className={
												selectedId === report.id
													? 'bg-muted/60'
													: 'cursor-pointer'
											}
											onClick={() => setSelectedId(report.id)}
										>
											<TableCell>
												<div className="font-medium">{report.title}</div>
												<div className="text-muted-foreground text-xs">
													{typeLabels[report.type]}
												</div>
											</TableCell>
											<TableCell>
												<div>{report.reporterName ?? 'Unknown'}</div>
												<div className="text-muted-foreground text-xs">
													{report.reporterEmail}
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="outline">
													{statusLabels[report.status]}
												</Badge>
											</TableCell>
											<TableCell>
												{new Date(report.createdAt).toLocaleString()}
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={4}>No reports found.</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				<Card className="h-fit">
					<CardHeader>
						<CardTitle>Report detail</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{selectedReport ? (
							<>
								<div className="flex items-start justify-between gap-3">
									<div>
										<h2 className="font-semibold text-xl">
											{selectedReport.title}
										</h2>
										<div className="mt-1 flex gap-2">
											<Badge>{typeLabels[selectedReport.type]}</Badge>
											<Badge variant="outline">
												{statusLabels[selectedReport.status]}
											</Badge>
										</div>
									</div>
									<Select
										value={selectedReport.status}
										onValueChange={(nextStatus) =>
											updateStatus.mutate({
												id: selectedReport.id,
												status: nextStatus as keyof typeof statusLabels
											})
										}
										disabled={updateStatus.isPending}
									>
										<SelectTrigger className="w-36">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{Object.entries(statusLabels).map(([value, label]) => (
												<SelectItem key={value} value={value}>
													{label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<section>
									<h3 className="font-medium">Description</h3>
									<p className="whitespace-pre-wrap text-sm">
										{selectedReport.description}
									</p>
								</section>

								<section className="space-y-1 text-sm">
									<h3 className="font-medium">Reporter</h3>
									<p>{selectedReport.reporterName ?? 'Unknown'}</p>
									<p className="text-muted-foreground">
										{selectedReport.reporterEmail}
									</p>
									<p className="text-muted-foreground">
										User ID: {selectedReport.userId}
									</p>
								</section>

								<section className="space-y-1 text-sm">
									<h3 className="font-medium">Context</h3>
									<a
										href={selectedReport.url}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1 break-all underline"
									>
										{selectedReport.url}
										<ExternalLink className="h-3 w-3" />
									</a>
									<p>Browser: {selectedReport.browser ?? 'Unknown'}</p>
									<p>
										Viewport:{' '}
										{selectedReport.viewportWidth &&
										selectedReport.viewportHeight
											? `${selectedReport.viewportWidth}x${selectedReport.viewportHeight}`
											: 'Unknown'}
									</p>
									<p className="break-all text-muted-foreground">
										UA: {selectedReport.userAgent}
									</p>
								</section>

								<section className="space-y-2 text-sm">
									<h3 className="font-medium">Screenshot</h3>
									{selectedReport.screenshotUrl ? (
										<a
											href={selectedReport.screenshotUrl}
											target="_blank"
											rel="noreferrer"
											className="block overflow-hidden rounded-md border"
										>
											<img
												src={selectedReport.screenshotUrl}
												alt="Feedback screenshot"
												className="max-h-80 w-full object-contain"
											/>
										</a>
									) : (
										<div className="flex items-center gap-2 text-muted-foreground">
											<ImageIcon className="h-4 w-4" /> No screenshot
										</div>
									)}
								</section>
							</>
						) : (
							<p className="text-muted-foreground text-sm">Select a report.</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
