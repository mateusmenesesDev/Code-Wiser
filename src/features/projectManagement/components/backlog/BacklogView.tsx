'use client';

import { ChevronRight, MoreHorizontal, Tag } from 'lucide-react';
import { useParams } from 'next/navigation';
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
import { PriorityCell } from './PriorityCell';

export function BacklogView() {
	const { slug } = useParams();

	const { data: project, isLoading } = api.projectTemplate.getBySlug.useQuery({
		slug: slug as string
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
								<TableHead className="w-[200px]">Assignee</TableHead>

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
												{task.sprintId ? (
													<Badge
														variant="outline"
														className="w-[120px] justify-center"
													>
														{project.sprints?.find(
															(sprint) => sprint.id === task.sprintId
														)?.title || 'Sprint'}
													</Badge>
												) : project.sprints && project.sprints.length > 0 ? (
													<Select
														onValueChange={() => {
															// TODO: Add sprint connection mutation
														}}
													>
														<SelectTrigger className="h-7 w-[120px]">
															<SelectValue placeholder="Add to Sprint" />
														</SelectTrigger>
														<SelectContent>
															{project.sprints.map((sprint) => (
																<SelectItem key={sprint.id} value={sprint.id}>
																	{sprint.title}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
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
												{task.epicId ? (
													<Badge
														variant="outline"
														className="w-[120px] justify-center"
													>
														{project.epics?.find(
															(epic) => epic.id === task.epicId
														)?.title || 'Epic'}
													</Badge>
												) : project.epics && project.epics.length > 0 ? (
													<Select
														onValueChange={() => {
															// TODO: Add epic connection mutation
														}}
													>
														<SelectTrigger className="h-7 w-[120px]">
															<SelectValue placeholder="Add to Epic" />
														</SelectTrigger>
														<SelectContent>
															{project.epics.map((epic) => (
																<SelectItem key={epic.id} value={epic.id}>
																	{epic.title}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
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
