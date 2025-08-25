'use client';

import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Lightbulb,
	ListTodo,
	Pencil,
	Plus,
	Target,
	Trash2
} from 'lucide-react';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from '~/common/components/ui/accordion';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Progress } from '~/common/components/ui/progress';
import { cn } from '~/lib/utils';
import type { EpicApiOutput } from '../../types/Epic.type';

interface EpicItemProps {
	epic: NonNullable<EpicApiOutput>;
	onEdit: () => void;
	onDelete: () => void;
}

export default function EpicItem({ epic, onEdit, onDelete }: EpicItemProps) {
	const totalTasks = epic.tasks?.length || 0;
	const completedTasks =
		epic.tasks?.filter((task) => task.status === 'DONE').length || 0;
	const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
	const isCompleted = totalTasks > 0 && completedTasks === totalTasks;

	return (
		<AccordionItem
			value={epic.id}
			className="group relative border-0 bg-white transition-all hover:shadow-md dark:bg-slate-950"
		>
			<AccordionTrigger
				className={cn(
					'flex w-full gap-4 rounded-lg border px-6 py-4 transition-colors hover:no-underline',
					isCompleted
						? 'border-purple-200 bg-purple-50/30 hover:bg-purple-50/50 dark:border-purple-900/50 dark:bg-purple-900/10 dark:hover:bg-purple-900/20'
						: 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
				)}
			>
				<div className="flex flex-1 items-center gap-4">
					<Lightbulb
						className={cn(
							'h-5 w-5',
							isCompleted ? 'text-purple-500' : 'text-purple-500'
						)}
					/>
					<div className="flex flex-1 items-center justify-between">
						<div className="space-y-1 text-left">
							<h3 className="font-semibold text-lg">{epic.title}</h3>
							{epic.description && (
								<p className="text-muted-foreground text-sm">
									{epic.description}
								</p>
							)}
						</div>
						<div className="flex items-center gap-6">
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-2">
									<Target className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">{Math.round(progress)}%</span>
								</div>
								<Progress
									value={progress}
									className={cn(
										'h-2 w-24',
										isCompleted
											? 'bg-purple-100 dark:bg-purple-900/20 [&>div]:bg-purple-500'
											: 'bg-purple-100 dark:bg-purple-900/20 [&>div]:bg-purple-500'
									)}
								/>
							</div>
							<div className="flex items-center gap-2">
								<Badge
									variant={isCompleted ? 'outline' : 'secondary'}
									className={cn(
										'rounded-md',
										isCompleted &&
											'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-900/20 dark:text-purple-400'
									)}
								>
									<ListTodo className="mr-1 h-3 w-3" />
									{totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
								</Badge>
								{completedTasks > 0 && (
									<Badge
										variant="outline"
										className="rounded-md border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400"
									>
										<CheckCircle2 className="mr-1 h-3 w-3" />
										{completedTasks} completed
									</Badge>
								)}
							</div>
							<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
								<Button
									variant="ghost"
									size="sm"
									onClick={(e) => {
										e.stopPropagation();
										onEdit();
									}}
								>
									<Pencil className="h-4 w-4" />
								</Button>
								<ConfirmationDialog
									title="Delete Epic"
									description={`Are you sure you want to delete "${epic.title}"? ${totalTasks > 0 ? `This will remove the epic association from ${totalTasks} task${totalTasks > 1 ? 's' : ''}.` : ''} This action cannot be undone.`}
									onConfirm={() => {
										onDelete();
									}}
								>
									<Button
										variant="ghost"
										size="sm"
										onClick={(e) => {
											e.stopPropagation();
										}}
										className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</ConfirmationDialog>
							</div>
						</div>
					</div>
				</div>
			</AccordionTrigger>

			<AccordionContent className="px-4">
				{epic.tasks?.length > 0 ? (
					<div className="space-y-2 py-4">
						{epic.tasks.map((task) => (
							<div
								key={task.id}
								className={cn(
									'flex items-center justify-between rounded-lg border px-4 py-3 transition-colors',
									task.status === 'DONE'
										? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400'
										: 'hover:border-purple-200 hover:bg-purple-50/50 dark:hover:border-purple-900/50 dark:hover:bg-purple-900/10'
								)}
							>
								<div className="flex items-center gap-3">
									{task.status === 'DONE' ? (
										<CheckCircle2 className="h-4 w-4 text-green-500" />
									) : (
										<Clock className="h-4 w-4 text-purple-500" />
									)}
									<div className="space-y-1">
										<span className="font-medium">{task.title}</span>
										{task.description && (
											<p className="text-muted-foreground text-sm">
												{task.description}
											</p>
										)}
									</div>
								</div>
								<div className="flex items-center gap-2">
									{task.priority && (
										<Badge variant="secondary" className="text-xs">
											{task.priority}
										</Badge>
									)}
									{task.status === 'DONE' && (
										<Badge
											variant="secondary"
											className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
										>
											Done
										</Badge>
									)}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="my-4 flex h-40 flex-col items-center justify-center gap-4 rounded-lg border border-dashed">
						<div className="flex flex-col items-center gap-2 text-center">
							<AlertCircle className="h-8 w-8 text-muted-foreground/50" />
							<p className="text-muted-foreground text-sm">
								No tasks in this epic
							</p>
						</div>
						<Button
							variant="outline"
							onClick={onEdit}
							className="border-purple-200 bg-purple-50/50 text-purple-600 hover:bg-purple-100 dark:border-purple-900/50 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30"
						>
							<Plus className="mr-2 h-4 w-4" />
							Add Task
						</Button>
					</div>
				)}
			</AccordionContent>
		</AccordionItem>
	);
}
