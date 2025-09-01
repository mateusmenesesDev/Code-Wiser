import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
	Loader2,
	MessageSquare,
	MoreVertical,
	Pencil,
	Trash2
} from 'lucide-react';
import { useState } from 'react';
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from '~/common/components/ui/avatar';
import { Button } from '~/common/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/common/components/ui/dropdown-menu';
import { Textarea } from '~/common/components/ui/textarea';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { useComments } from '~/features/workspace/hooks/useComments';
import type { CommentsApiOutput } from '~/features/workspace/types/Comment.type';
import { cn } from '~/lib/utils';

dayjs.extend(relativeTime);

interface TaskCommentsProps {
	isEditing: boolean;
	taskId: string;
}

export function TaskComments({ taskId, isEditing }: TaskCommentsProps) {
	const { user } = useAuth();
	const {
		addComment,
		updateComment,
		deleteComment,
		updateCommentMutation,
		comments
	} = useComments({ taskId });
	const [newComment, setNewComment] = useState('');
	const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
	const [editedContent, setEditedContent] = useState('');

	const handleAddComment = () => {
		if (!newComment.trim()) return;
		addComment(newComment.trim());
		setNewComment('');
	};

	const handleEditComment = (id: string) => {
		if (!editedContent.trim()) return;
		updateComment(id, editedContent.trim());
		setEditingCommentId(null);
		setEditedContent('');
	};

	const handleDeleteComment = async (id: string) => {
		await deleteComment(id);
	};

	const startEditing = (comment: CommentsApiOutput[number]) => {
		setEditingCommentId(comment.id);
		setEditedContent(comment.content);
	};

	const cancelEditing = () => {
		setEditingCommentId(null);
		setEditedContent('');
	};

	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLTextAreaElement>,
		isEditing = false,
		commentId?: string
	) => {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			if (isEditing && commentId) {
				void handleEditComment(commentId);
			} else {
				void handleAddComment();
			}
		} else if (e.key === 'Escape' && isEditing) {
			cancelEditing();
		}
	};

	return (
		<div className={cn(!isEditing && 'opacity-50')}>
			<h3 className="mb-3 font-medium text-muted-foreground text-sm">
				<MessageSquare className="mr-1 inline h-4 w-4" />
				Comments ({isEditing ? comments.length : 0})
			</h3>

			{isEditing ? (
				<>
					<div className="max-h-[13rem] space-y-3 overflow-y-auto">
						{comments.map((comment) => {
							const isEditing = editingCommentId === comment.id;
							const isOwnComment = user?.id === comment.authorId;

							return (
								<div key={comment.id} className={cn('flex gap-3')}>
									<Avatar className="h-8 w-8">
										<AvatarImage
											src={comment.authorImageUrl}
											alt={comment.author.name || comment.author.email}
										/>
										<AvatarFallback className="text-xs">
											{comment.author.name?.[0] || comment.author.email[0]}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1 space-y-1">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span className="font-medium text-sm">
													{comment.author.name || comment.author.email}
												</span>
												<span className="text-muted-foreground text-xs">
													{dayjs(comment.createdAt).fromNow()}
												</span>
											</div>
											{isOwnComment && (
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
														>
															<MoreVertical className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={() => startEditing(comment)}
														>
															<Pencil className="mr-2 h-4 w-4" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleDeleteComment(comment.id)}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											)}
										</div>
										{isEditing ? (
											<div className="space-y-2">
												<Textarea
													value={editedContent}
													onChange={(e) => setEditedContent(e.target.value)}
													onKeyDown={(e) => handleKeyDown(e, true, comment.id)}
													className="min-h-[80px]"
													disabled={updateCommentMutation.isPending}
													autoFocus
												/>
												<div className="flex gap-2">
													<Button
														onClick={() => handleEditComment(comment.id)}
														size="sm"
														disabled={
															updateCommentMutation.isPending ||
															!editedContent.trim()
														}
														type="button"
													>
														{updateCommentMutation.isPending && (
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														)}
														{updateCommentMutation.isPending
															? 'Updating...'
															: 'Update'}
													</Button>
													<Button
														onClick={cancelEditing}
														size="sm"
														variant="outline"
														disabled={updateCommentMutation.isPending}
													>
														Cancel
													</Button>
												</div>
											</div>
										) : (
											<p className="text-sm">{comment.content}</p>
										)}
									</div>
								</div>
							);
						})}
					</div>

					{/* Add Comment */}
					<div className="mt-6 space-y-2">
						<Textarea
							placeholder="Add a comment... (Ctrl+Enter to submit)"
							value={newComment}
							onChange={(e) => setNewComment(e.target.value)}
							onKeyDown={(e) => handleKeyDown(e)}
							className="mb-2 min-h-[80px]"
						/>
						<Button onClick={handleAddComment} size="sm" type="button">
							Add Comment
						</Button>
					</div>
				</>
			) : (
				<div className="rounded-lg border border-muted-foreground/25 border-dashed p-6 text-center">
					<MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
					<p className="text-muted-foreground text-sm">
						Comments will be available after creating the task
					</p>
				</div>
			)}
		</div>
	);
}
