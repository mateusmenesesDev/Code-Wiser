'use client';

import { ChevronRight, MoreHorizontal, Tag } from 'lucide-react';
import { Badge } from '~/common/components/badge';
import { Button } from '~/common/components/button';
import { Checkbox } from '~/common/components/checkbox';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/common/components/dropdown-menu';
import { ScrollArea } from '~/common/components/scroll-area';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/table';
import type { Project } from '../../types';

interface BacklogViewProps {
	project: Project;
	isTemplatePage?: boolean;
}

export function BacklogView({ project, isTemplatePage }: BacklogViewProps) {
	console.log(project);
	return (
		<div className="h-full w-full p-6">
			<ScrollArea className="h-[calc(100vh-8rem)]">
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[50px]">
									<Checkbox />
								</TableHead>
								<TableHead className="min-w-[500px]">Task</TableHead>
								<TableHead className="w-[100px]">Priority</TableHead>
								<TableHead className="w-[200px]">Tags</TableHead>
								{project.methodology === 'scrum' && (
									<>
										<TableHead className="w-[150px]">Sprint</TableHead>
										<TableHead className="w-[150px]">Epic</TableHead>
									</>
								)}
								{!isTemplatePage && (
									<>
										<TableHead className="w-[100px]">Status</TableHead>
										<TableHead className="w-[200px]">Assignee</TableHead>
									</>
								)}
								<TableHead className="w-[70px]" />
							</TableRow>
						</TableHeader>
						<TableBody className="min-w-full table-fixed">
							{project.backlog.map((task) => (
								<TableRow key={task.id} className="group">
									<TableCell className="w-[50px]">
										<Checkbox />
									</TableCell>
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
										<Badge
											variant={
												task.priority === 'HIGH'
													? 'destructive'
													: task.priority === 'MEDIUM'
														? 'default'
														: 'secondary'
											}
											className="w-[70px] justify-center"
										>
											{task.priority}
										</Badge>
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
									{project.methodology === 'scrum' && (
										<>
											<TableCell className="w-[150px]">
												<Select defaultValue={String(task.sprintId)}>
													<SelectTrigger className="h-7 w-[120px]">
														<SelectValue placeholder="Add to Sprint" />
													</SelectTrigger>
													<SelectContent>
														{project.sprints?.map((sprint) => (
															<SelectItem
																key={sprint.id}
																value={String(sprint.id)}
															>
																{sprint.title}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell className="w-[150px]">
												{task.epicId ? (
													<Badge
														variant="outline"
														className="w-[120px] justify-center"
													>
														{project.epics?.find(
															(epic) => epic.id === task.epicId
														)?.title || task.epicId}
													</Badge>
												) : (
													<Select>
														<SelectTrigger className="h-7 w-[120px]">
															<SelectValue placeholder="Add to Epic" />
														</SelectTrigger>
														<SelectContent>
															{project.epics?.map((epic) => (
																<SelectItem
																	key={epic.id}
																	value={String(epic.id)}
																>
																	{epic.title}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												)}
											</TableCell>
										</>
									)}
									{!isTemplatePage && (
										<>
											<TableCell className="w-[100px]">
												<Badge
													variant="outline"
													className="w-[80px] justify-center"
												>
													{task.status}
												</Badge>
											</TableCell>
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
										</>
									)}
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
												<DropdownMenuItem>Move to Sprint</DropdownMenuItem>
												<DropdownMenuItem>Add to Epic</DropdownMenuItem>
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
