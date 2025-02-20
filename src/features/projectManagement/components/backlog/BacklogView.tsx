'use client';

import { ChevronRight, MoreHorizontal, Tag, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Checkbox } from '~/common/components/ui/checkbox';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/common/components/ui/dropdown-menu';
import { ScrollArea } from '~/common/components/ui/scroll-area';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';
import { useIsTemplate } from '~/common/hooks/useIsTemplate';
import { useTask } from '~/features/tasks/hooks/useTask';
import { api } from '~/trpc/react';
import { PriorityCell } from './PriorityCell';

function SprintEpicCell({
	type,
	value,
	items,
	onUpdate
}: {
	type: 'sprint' | 'epic';
	value: string | null;
	items: Array<{ id: string; title: string }>;
	onUpdate: (id: string | null) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const selectedItem = items.find((item) => item.id === value);

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-7 w-[120px] justify-between gap-1 text-xs"
				>
					{selectedItem ? (
						<>
							<span className="truncate">{selectedItem.title}</span>
							<X
								className="h-3 w-3 shrink-0 opacity-50"
								onClick={(e) => {
									e.stopPropagation();
									onUpdate(null);
								}}
							/>
						</>
					) : (
						`Add to ${type === 'sprint' ? 'Sprint' : 'Epic'}`
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-[200px]">
				{items.map((item) => (
					<DropdownMenuItem
						key={item.id}
						onClick={() => {
							onUpdate(item.id);
							setIsOpen(false);
						}}
					>
						{item.title}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function BacklogView() {
	const isTemplate = useIsTemplate();
	const { slug } = useParams();

	const { data: project, isLoading } = isTemplate
		? api.projectTemplate.getBySlug.useQuery({
				slug: slug as string
			})
		: api.project.getBySlug.useQuery({
				slug: slug as string
			});

	const { updateTask } = useTask({
		isTemplate,
		projectSlug: slug as string
	});

	if (isLoading) return <div>Loading...</div>;

	if (!project) return null;

	return (
		<div className="h-full w-full">
			<ScrollArea className="h-[calc(100vh-15rem)]">
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[50px]">
									<Checkbox />
								</TableHead>
								{!isTemplate && (
									<TableHead className="w-[200px]">Assignee</TableHead>
								)}

								<TableHead className="min-w-[500px]">Task</TableHead>
								<TableHead className="w-[100px]">Priority</TableHead>
								<TableHead className="w-[200px]">Tags</TableHead>
								{project.methodology === 'SCRUM' && (
									<>
										<TableHead className="w-[150px]">Sprint</TableHead>
										<TableHead className="w-[150px]">Epic</TableHead>
									</>
								)}
								<TableHead className="w-[100px]">Status</TableHead>
								<TableHead className="w-[70px]" />
							</TableRow>
						</TableHeader>
						<TableBody className="min-w-full table-fixed">
							{project.tasks.map((task) => (
								<TableRow key={task.id} className="group">
									<TableCell className="w-[50px]">
										<Checkbox />
									</TableCell>
									{!isTemplate && (
										<TableCell className="w-[200px]">
											{task.assigneeId ? (
												<div className="flex items-center gap-2">
													<div className="h-6 w-6 rounded-full bg-muted" />
													<span className="truncate text-sm">
														{task.assigneeId}
													</span>
												</div>
											) : (
												<Button
													variant="ghost"
													size="sm"
													className="h-6 px-2 text-xs"
												>
													Assign
												</Button>
											)}
										</TableCell>
									)}
									<TableCell className="min-w-[500px]">
										<div className="flex items-center gap-2">
											<ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
											<div className="min-w-0 flex-1">
												<div className="truncate font-medium">{task.title}</div>
												<div className="truncate text-muted-foreground text-xs">
													{task.description}
												</div>
											</div>
										</div>
									</TableCell>
									<TableCell className="w-[100px]">
										<PriorityCell
											priority={task.priority ?? '-'}
											taskId={task.id}
											isTemplate={isTemplate}
											projectSlug={slug as string}
										/>
									</TableCell>
									<TableCell className="w-[200px]">
										<div className="flex flex-wrap gap-1">
											{task.tags?.map((tag) => (
												<Badge key={tag} variant="outline" className="text-xs">
													<Tag className="mr-1 h-3 w-3" />
													{tag}
												</Badge>
											))}
										</div>
									</TableCell>
									{project.methodology === 'SCRUM' && (
										<>
											<TableCell className="w-[150px]">
												{project.sprints && project.sprints.length > 0 ? (
													<SprintEpicCell
														type="sprint"
														value={task.sprintId}
														items={project.sprints}
														onUpdate={(sprintId) =>
															updateTask({
																taskId: task.id,
																sprintId: sprintId ?? undefined
															})
														}
													/>
												) : (
													<Button
														variant="outline"
														size="sm"
														className="h-7 w-[120px]"
														onClick={() => {
															// TODO: Navigate to sprints page or open create sprint dialog
														}}
													>
														Create Sprint
													</Button>
												)}
											</TableCell>
											<TableCell className="w-[150px]">
												{project.epics && project.epics.length > 0 ? (
													<SprintEpicCell
														type="epic"
														value={task.epicId}
														items={project.epics}
														onUpdate={(epicId) =>
															updateTask({
																taskId: task.id,
																epicId: epicId ?? undefined
															})
														}
													/>
												) : (
													<Button
														variant="outline"
														size="sm"
														className="h-7 w-[120px]"
														onClick={() => {
															// TODO: Navigate to epics page or open create epic dialog
														}}
													>
														Create Epic
													</Button>
												)}
											</TableCell>
										</>
									)}
									<TableCell className="w-[100px]">
										<Badge
											variant="outline"
											className="w-[80px] justify-center"
										>
											{task.status}
										</Badge>
									</TableCell>
									<TableCell className="w-[70px]">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
												>
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem>Edit</DropdownMenuItem>
												<DropdownMenuItem className="text-destructive">
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</ScrollArea>
		</div>
	);
}
