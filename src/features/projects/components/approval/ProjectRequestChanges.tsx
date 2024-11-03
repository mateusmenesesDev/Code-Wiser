import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '~/common/components/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/dialog';
import { Label } from '~/common/components/label';
import { Textarea } from '~/common/components/textarea';

const requestChangesSchema = z.object({
	feedback: z.string().min(1, 'Feedback is required')
});

type RequestChangesFormData = z.infer<typeof requestChangesSchema>;

type ProjectRequestChangesProps = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (feedback: string) => void;
	projectTitle: string;
	isLoading?: boolean;
};

export function ProjectRequestChanges({
	isOpen,
	onClose,
	onSubmit,
	projectTitle,
	isLoading
}: ProjectRequestChangesProps) {
	const form = useForm<RequestChangesFormData>({
		resolver: zodResolver(requestChangesSchema)
	});

	const handleSubmit = (data: RequestChangesFormData) => {
		onSubmit(data.feedback);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Request Changes</DialogTitle>
					<DialogDescription>
						Request changes for project "{projectTitle}". The author will be
						notified of your feedback.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={form.handleSubmit(handleSubmit)}>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="feedback">Feedback</Label>
							<Textarea
								id="feedback"
								placeholder="What changes are needed?"
								{...form.register('feedback')}
							/>
							{form.formState.errors.feedback && (
								<p className="destructive text-sm">
									{form.formState.errors.feedback.message}
								</p>
							)}
						</div>
					</div>
					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? 'Sending...' : 'Send Feedback'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
