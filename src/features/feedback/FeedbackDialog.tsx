'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '~/common/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '~/common/components/ui/form';
import { Input } from '~/common/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { Textarea } from '~/common/components/ui/textarea';
import { UploadDropzone } from '~/common/utils/uploadthing';
import { api } from '~/trpc/react';
import { createFeedbackInputSchema } from './feedback.schema';

type Screenshot = { url: string; key?: string };

const formSchema = createFeedbackInputSchema.pick({
	type: true,
	title: true,
	description: true
});

type FeedbackFormData = z.infer<typeof formSchema>;

function detectBrowser(userAgent: string) {
	if (userAgent.includes('Edg/')) return 'Edge';
	if (userAgent.includes('Chrome/')) return 'Chrome';
	if (userAgent.includes('Firefox/')) return 'Firefox';
	if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
		return 'Safari';
	}
	return 'Unknown';
}

export function FeedbackDialog({
	open,
	onOpenChange
}: { open: boolean; onOpenChange: (open: boolean) => void }) {
	const [screenshot, setScreenshot] = useState<Screenshot | null>(null);
	const utils = api.useUtils();
	const createFeedback = api.feedback.create.useMutation({
		onSuccess: async () => {
			toast.success('Report submitted. Thank you.');
			form.reset();
			setScreenshot(null);
			onOpenChange(false);
			await utils.feedback.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || 'Could not submit report.');
		}
	});

	const form = useForm<FeedbackFormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			type: 'SUGGESTION',
			title: '',
			description: ''
		}
	});

	useEffect(() => {
		if (!open) return;
		form.reset({ type: 'SUGGESTION', title: '', description: '' });
		setScreenshot(null);
	}, [open, form]);

	const onSubmit = form.handleSubmit((values) => {
		const userAgent = window.navigator.userAgent;

		createFeedback.mutate({
			...values,
			url: window.location.href,
			userAgent,
			browser: detectBrowser(userAgent),
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight,
			screenshotUrl: screenshot?.url,
			screenshotKey: screenshot?.key
		});
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Send feedback or report a bug</DialogTitle>
					<DialogDescription>
						Tell us what happened. We include the current page, browser, and
						viewport automatically.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={onSubmit} className="space-y-4">
						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Type</FormLabel>
									<Select value={field.value} onValueChange={field.onChange}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="BUG">Bug report</SelectItem>
											<SelectItem value="SUGGESTION">Suggestion</SelectItem>
											<SelectItem value="QUESTION">Question</SelectItem>
											<SelectItem value="OTHER">Other</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input placeholder="Short summary" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="What did you expect? What happened instead?"
											className="min-h-32"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="space-y-2">
							<div>
								<div className="font-medium text-sm">Screenshot (optional)</div>
								<p className="text-muted-foreground text-xs">
									Only upload screenshots you are comfortable sharing. Avoid
									including secrets, tokens, or private messages.
								</p>
							</div>
							{screenshot ? (
								<div className="flex items-center justify-between rounded-md border p-2 text-sm">
									<a
										href={screenshot.url}
										target="_blank"
										rel="noreferrer"
										className="truncate underline"
									>
										Screenshot uploaded
									</a>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setScreenshot(null)}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							) : (
								<UploadDropzone
									endpoint="feedbackScreenshot"
									onClientUploadComplete={(files) => {
										const file = files?.[0];
										if (!file) return;
										setScreenshot({ url: file.ufsUrl, key: file.key });
									}}
									onUploadError={(error) => {
										toast.error(error.message || 'Screenshot upload failed.');
									}}
								/>
							)}
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={createFeedback.isPending}>
								{createFeedback.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Submit report
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
