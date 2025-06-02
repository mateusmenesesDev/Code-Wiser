import { type Task, TaskStatusEnum } from '@prisma/client';
import {
	ArrowUp,
	Calendar,
	Clock,
	Flag,
	GitBranch,
	Loader2,
	MessageSquare,
	Tag,
	Target
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '~/common/components/ui/avatar';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import { Separator } from '~/common/components/ui/separator';
import { Switch } from '~/common/components/ui/switch';
import { Textarea } from '~/common/components/ui/textarea';
import { useDialog } from '~/common/hooks/useDialog';
import { cn } from '~/lib/utils';

interface TaskDialogProps {
	task: Task;
	comments: Array<{
		id: string;
		content: string;
		createdAt: Date;
		author: {
			id: string;
			name: string | null;
			email: string;
		};
	}>;
	onAddComment: (content: string) => Promise<void>;
	isAddingComment?: boolean;
	epics?: Array<{ id: string; title: string }>;
	sprints?: Array<{ id: string; title: string }>;
}

export function TaskDialog({
	task,
	comments,
	onAddComment,
	isAddingComment = false,
	epics = [],
	sprints = []
}: TaskDialogProps) {
	const { isDialogOpen, closeDialog } = useDialog();

	const isOpen = isDialogOpen('task');

	const [prUrl, setPrUrl] = useState('');
	const [newComment, setNewComment] = useState('');

	const epic = epics.find((e) => e.id === task.epicId);
	const sprint = sprints.find((s) => s.id === task.sprintId);

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'HIGHEST':
				return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
			case 'HIGH':
				return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
			case 'MEDIUM':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
			case 'LOW':
				return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
			case 'LOWEST':
				return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'TODO':
				return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
			case 'IN_PROGRESS':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
			case 'IN_REVIEW':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
			case 'DONE':
				return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
		}
	};

	const getStatusLabel = (status: TaskStatusEnum) => {
		switch (status) {
			case TaskStatusEnum.BACKLOG:
				return 'To Do';
			case TaskStatusEnum.READY_TO_DEVELOP:
				return 'Ready to Develop';
			case TaskStatusEnum.IN_PROGRESS:
				return 'In Progress';
			case TaskStatusEnum.CODE_REVIEW:
				return 'Code Review';
			case TaskStatusEnum.DONE:
				return 'Done';
			default:
				return status;
		}
	};

	const handleAddComment = async () => {
		if (!newComment.trim()) return;

		try {
			await onAddComment(newComment.trim());
			setNewComment('');
		} catch (error) {
			console.error('Error adding comment:', error);
		}
	};

	const formatDate = (date: Date | null | undefined) => {
		if (!date) return null;
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(date);
	};

	const getTimeAgo = (date: Date | null | undefined) => {
		if (!date) return 'Unknown';
		const now = new Date();
		const diffInMs = now.getTime() - date.getTime();
		const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

		if (diffInDays === 0) return 'Today';
		if (diffInDays === 1) return '1 day ago';
		return `${diffInDays} days ago`;
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			void handleAddComment();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={closeDialog}>
			<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="pr-8 font-semibold text-xl">
						{task.title}
					</DialogTitle>
				</DialogHeader>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{/* Main Content */}
					<div className="space-y-6 lg:col-span-2">
						{/* Description */}
						<div>
							<h3 className="mb-2 font-medium text-muted-foreground text-sm">
								Description
							</h3>
							<div className="prose prose-sm dark:prose-invert max-w-none">
								<p className="text-sm">
									{task.description || 'No description provided.'}
								</p>
							</div>
						</div>

						{/* Code Review Request Section */}
						<div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:border-purple-700 dark:from-purple-900/20 dark:to-blue-900/20">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<h3 className="mb-2 font-semibold text-purple-700 text-sm dark:text-purple-300">
										Need help with this task?
									</h3>
									<p className="mb-3 text-purple-600 text-sm dark:text-purple-400">
										Get your code reviewed by an experienced mentor. They'll
										provide feedback on your implementation, suggest
										improvements, and help you learn best practices.
									</p>
									<div className="flex items-center gap-2 text-purple-500 text-xs dark:text-purple-400">
										<span>💳 Costs 5 credits</span>
										<span>•</span>
										<span>✨ Free with mentorship plan</span>
									</div>
								</div>
								<Button
									disabled={true}
									className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
									size="sm"
								>
									Request CR (Soon)
								</Button>
							</div>
						</div>

						{/* Blocked Status Section */}
						{task.blocked && (
							<div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
								<div className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
									<div className="flex-1">
										<h3 className="mb-1 font-semibold text-red-700 text-sm dark:text-red-300">
											Task Blocked
										</h3>
										<p className="text-red-600 text-sm dark:text-red-400">
											{task.blockedReason || 'This task is currently blocked.'}
										</p>
									</div>
								</div>
							</div>
						)}

						{/* Links and Pull Request */}
						<div className="space-y-4">
							<div>
								<h3 className="mb-2 font-medium text-muted-foreground text-sm">
									Pull Request
								</h3>
								<div className="flex gap-2">
									<Input
										type="url"
										value={prUrl}
										onChange={(e) => setPrUrl(e.target.value)}
										placeholder="https://github.com/user/repo/pull/123"
										className="flex-1"
										disabled={true}
									/>
									<Button variant="outline" size="sm" disabled={true}>
										Save (Soon)
									</Button>
								</div>
								{prUrl && (
									<Button variant="outline" size="sm" className="mt-2" asChild>
										<a href={prUrl} target="_blank" rel="noopener noreferrer">
											<GitBranch className="mr-2 h-4 w-4" />
											View Pull Request
										</a>
									</Button>
								)}
							</div>
						</div>

						{/* Comments */}
						<div>
							<h3 className="mb-3 font-medium text-muted-foreground text-sm">
								<MessageSquare className="mr-1 inline h-4 w-4" />
								Comments ({comments.length})
							</h3>

							<div className="max-h-60 space-y-3 overflow-y-auto">
								{comments.map((comment) => {
									const isOptimistic = comment.id.startsWith('temp-');
									return (
										<div
											key={comment.id}
											className={cn('flex gap-3', isOptimistic && 'opacity-70')}
										>
											<Avatar className="h-8 w-8">
												<AvatarFallback className="text-xs">
													{comment.author.name?.[0] || comment.author.email[0]}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 space-y-1">
												<div className="flex items-center gap-2">
													<span className="font-medium text-sm">
														{comment.author.name || comment.author.email}
													</span>
													<span className="text-muted-foreground text-xs">
														{getTimeAgo(comment.createdAt)}
													</span>
													{isOptimistic && (
														<span className="text-muted-foreground text-xs italic">
															Sending...
														</span>
													)}
												</div>
												<p className="text-sm">{comment.content}</p>
											</div>
										</div>
									);
								})}
							</div>

							{/* Add Comment */}
							<div className="mt-4 space-y-2">
								<Textarea
									placeholder="Add a comment... (Ctrl+Enter to submit)"
									value={newComment}
									onChange={(e) => setNewComment(e.target.value)}
									onKeyDown={handleKeyDown}
									className="min-h-[80px]"
									disabled={isAddingComment}
								/>
								<Button
									onClick={handleAddComment}
									size="sm"
									disabled={isAddingComment || !newComment.trim()}
								>
									{isAddingComment && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									{isAddingComment ? 'Adding...' : 'Add Comment'}
								</Button>
							</div>
						</div>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Status */}
						<div>
							<h3 className="mb-2 font-medium text-muted-foreground text-sm">
								Status
							</h3>
							<Badge
								variant="outline"
								className={getStatusColor(task.status as TaskStatusEnum)}
							>
								{getStatusLabel(task.status as TaskStatusEnum)}
							</Badge>
						</div>

						{/* Priority */}
						<div>
							<h3 className="mb-2 font-medium text-muted-foreground text-sm">
								Priority
							</h3>
							<Badge
								variant="outline"
								className={getPriorityColor(task.priority || 'MEDIUM')}
							>
								<Flag className="mr-1 h-3 w-3" />
								{task.priority || 'Medium'}
							</Badge>
						</div>

						{/* Assignee */}
						<div>
							<h3 className="mb-2 font-medium text-muted-foreground text-sm">
								Assignee
							</h3>
							<div className="flex items-center gap-2">
								<Avatar className="h-6 w-6">
									<AvatarFallback className="text-xs">
										{task.assigneeId?.[0] || 'U'}
									</AvatarFallback>
								</Avatar>
								<span className="text-sm">
									{task.assigneeId || 'Unassigned'}
								</span>
							</div>
						</div>

						{/* Due Date */}
						{task.dueDate && (
							<div>
								<h3 className="mb-2 font-medium text-muted-foreground text-sm">
									Due Date
								</h3>
								<div className="flex items-center gap-2 text-sm">
									<Calendar className="h-4 w-4" />
									{formatDate(task.dueDate)}
								</div>
							</div>
						)}

						{/* Epic */}
						{epic && (
							<div>
								<h3 className="mb-2 font-medium text-muted-foreground text-sm">
									Epic
								</h3>
								<Badge
									variant="outline"
									className="border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
								>
									<ArrowUp className="mr-1 h-3 w-3" />
									{epic.title}
								</Badge>
							</div>
						)}

						{/* Sprint */}
						{sprint && (
							<div>
								<h3 className="mb-2 font-medium text-muted-foreground text-sm">
									Sprint
								</h3>
								<div className="flex items-center gap-2 text-sm">
									<Target className="h-4 w-4" />
									{sprint.title}
								</div>
							</div>
						)}

						{/* Blocked Status Toggle */}
						<div className="space-y-3 rounded-lg border bg-muted/20 p-4">
							<div className="flex items-center space-x-2">
								<Switch
									id="blocked"
									checked={task.blocked || false}
									onCheckedChange={(_value) => {
										// TODO: Implement the logic to update the task's blocked status
									}}
								/>
								<Label htmlFor="blocked" className="font-medium text-sm">
									This task is blocked
								</Label>
							</div>
							<p className="text-muted-foreground text-xs">
								Mark this task as blocked if it cannot proceed
							</p>

							{task.blocked && (
								<div className="space-y-2">
									<Label
										htmlFor="blocked-reason"
										className="font-medium text-sm"
									>
										Blocked Reason
									</Label>
									<Textarea
										id="blocked-reason"
										value={task.blockedReason || ''}
										onChange={(_e) => {
											// TODO: Implement the logic to update the task's blocked reason
										}}
										placeholder="Explain why this task is blocked..."
										className="min-h-[80px]"
									/>
								</div>
							)}
						</div>

						{/* Tags */}
						{task.tags.length > 0 && (
							<div>
								<h3 className="mb-2 font-medium text-muted-foreground text-sm">
									Labels
								</h3>
								<div className="flex flex-wrap gap-1">
									{task.tags.map((tag) => (
										<Badge key={tag} variant="secondary" className="text-xs">
											<Tag className="mr-1 h-2 w-2" />
											{tag}
										</Badge>
									))}
								</div>
							</div>
						)}

						<Separator />

						{/* Task ID */}
						<div>
							<h3 className="mb-2 font-medium text-muted-foreground text-sm">
								Task ID
							</h3>
							<code className="rounded bg-muted px-2 py-1 text-xs">
								{task.id}
							</code>
						</div>

						{/* Created */}
						<div>
							<h3 className="mb-2 font-medium text-muted-foreground text-sm">
								Created
							</h3>
							<div className="flex items-center gap-2 text-sm">
								<Clock className="h-4 w-4" />
								{getTimeAgo(task.createdAt)}
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
