'use client';

import { Eye, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { ScrollArea } from '~/common/components/ui/scroll-area';

type MarkdownPreviewProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	url: string;
};

export function AttachmentMarkdownPreview({
	open,
	onOpenChange,
	title,
	url
}: MarkdownPreviewProps) {
	const [content, setContent] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!open) {
			setContent(null);
			return;
		}

		let cancelled = false;
		setIsLoading(true);

		void fetch(url)
			.then(async (response) => {
				if (!response.ok) {
					throw new Error('Failed to load markdown file');
				}
				return response.text();
			})
			.then((text) => {
				if (!cancelled) setContent(text);
			})
			.catch((error) => {
				if (!cancelled) {
					toast.error(
						error instanceof Error ? error.message : 'Failed to load preview'
					);
					onOpenChange(false);
				}
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [open, url, onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
				<DialogHeader className="border-border border-b px-6 py-4">
					<DialogTitle className="truncate pr-8">{title}</DialogTitle>
				</DialogHeader>
				<div className="min-h-0 flex-1 overflow-hidden px-6 py-4">
					{isLoading || content === null ? (
						<div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
							<Loader2 className="h-4 w-4 animate-spin" />
							Loading preview...
						</div>
					) : (
						<ScrollArea className="h-[min(60vh,32rem)] pr-4">
							<article className="space-y-3 text-sm leading-relaxed">
								<ReactMarkdown
									remarkPlugins={[remarkGfm]}
									rehypePlugins={[rehypeSanitize]}
									components={{
										h1: ({ children }) => (
											<h1 className="font-semibold text-2xl">{children}</h1>
										),
										h2: ({ children }) => (
											<h2 className="font-semibold text-xl">{children}</h2>
										),
										h3: ({ children }) => (
											<h3 className="font-semibold text-lg">{children}</h3>
										),
										p: ({ children }) => <p className="text-sm">{children}</p>,
										ul: ({ children }) => (
											<ul className="list-disc space-y-1 pl-5">{children}</ul>
										),
										ol: ({ children }) => (
											<ol className="list-decimal space-y-1 pl-5">
												{children}
											</ol>
										),
										a: ({ href, children }) => (
											<a
												href={href}
												target="_blank"
												rel="noopener noreferrer"
												className="text-primary underline underline-offset-2"
											>
												{children}
											</a>
										),
										code: ({ children, className }) => {
											const isBlock = Boolean(className);
											if (isBlock) {
												return (
													<code className="block overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
														{children}
													</code>
												);
											}
											return (
												<code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
													{children}
												</code>
											);
										},
										pre: ({ children }) => (
											<pre className="overflow-x-auto rounded-md bg-muted p-0">
												{children}
											</pre>
										),
										blockquote: ({ children }) => (
											<blockquote className="border-muted-foreground/40 border-l-2 pl-3 text-muted-foreground italic">
												{children}
											</blockquote>
										)
									}}
								>
									{content}
								</ReactMarkdown>
							</article>
						</ScrollArea>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

type ImagePreviewProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	url: string;
};

export function AttachmentImagePreview({
	open,
	onOpenChange,
	title,
	url
}: ImagePreviewProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl overflow-hidden border-none bg-transparent p-2 shadow-none sm:max-w-4xl">
				<DialogHeader className="sr-only">
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<img
					src={url}
					alt={title}
					className="max-h-[85vh] w-full rounded-md object-contain"
				/>
			</DialogContent>
		</Dialog>
	);
}

type PreviewButtonProps = {
	label: string;
	onClick: () => void;
};

export function AttachmentPreviewButton({
	label,
	onClick
}: PreviewButtonProps) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className="h-8 w-8 shrink-0"
			onClick={onClick}
			aria-label={label}
		>
			<Eye className="h-4 w-4" />
		</Button>
	);
}
