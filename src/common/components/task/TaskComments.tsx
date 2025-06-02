import { zodResolver } from '@hookform/resolvers/zod';
import { MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '~/common/components/ui/avatar';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage
} from '~/common/components/ui/form';
import { Textarea } from '~/common/components/ui/textarea';
import {
	type CreateCommentInput,
	createCommentSchema
} from '~/features/workspace/schemas/comment.schema';

interface Comment {
	id: string;
	content: string;
	createdAt: Date;
	author: {
		id: string;
		name: string | null;
		email: string;
	};
}

interface TaskCommentsProps {
	taskId: string;
	comments: Comment[];
	onAddComment: (content: string) => Promise<void>;
}

export function TaskComments({
	taskId,
	comments,
	onAddComment
}: TaskCommentsProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<CreateCommentInput>({
		resolver: zodResolver(createCommentSchema),
		defaultValues: {
			content: '',
			taskId
		}
	});

	const handleSubmit = async (data: CreateCommentInput) => {
		setIsSubmitting(true);
		try {
			await onAddComment(data.content);
			form.reset({ content: '', taskId });
			toast.success('Comment added successfully');
		} catch (_error) {
			toast.error('Failed to add comment');
		} finally {
			setIsSubmitting(false);
		}
	};

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
	};

	const getInitials = (name: string | null, email: string) => {
		if (name) {
			return name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2);
		}
		return email.slice(0, 2).toUpperCase();
	};

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<MessageCircle className="h-4 w-4" />
					Comments ({comments.length})
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Add Comment Form */}
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-3"
					>
						<FormField
							control={form.control}
							name="content"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Textarea
											placeholder="Add a comment..."
											rows={3}
											className="resize-none"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end">
							<Button
								type="submit"
								size="sm"
								disabled={isSubmitting || !form.watch('content').trim()}
								className="gap-2"
							>
								<Send className="h-3 w-3" />
								{isSubmitting ? 'Adding...' : 'Add Comment'}
							</Button>
						</div>
					</form>
				</Form>

				{/* Comments List */}
				<div className="space-y-4">
					{comments.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground">
							<MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
							<p>No comments yet. Be the first to comment!</p>
						</div>
					) : (
						comments.map((comment) => (
							<div
								key={comment.id}
								className="flex gap-3 rounded-lg bg-muted/30 p-3"
							>
								<Avatar className="h-8 w-8">
									<AvatarFallback className="text-xs">
										{getInitials(comment.author.name, comment.author.email)}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1 space-y-1">
									<div className="flex items-center gap-2">
										<span className="font-medium text-sm">
											{comment.author.name || comment.author.email}
										</span>
										<span className="text-muted-foreground text-xs">
											{formatDate(comment.createdAt)}
										</span>
									</div>
									<p className="whitespace-pre-wrap text-foreground text-sm">
										{comment.content}
									</p>
								</div>
							</div>
						))
					)}
				</div>
			</CardContent>
		</Card>
	);
}
