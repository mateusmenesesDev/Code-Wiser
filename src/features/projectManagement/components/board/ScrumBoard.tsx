'use client';

import { Calendar } from 'lucide-react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { ScrollArea } from '~/common/components/ui/scroll-area';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from '~/common/components/ui/tabs';
import { TaskCard } from '../../../tasks/components/TaskCard';
import { ColumnHeader } from './ColumnHeader';

interface ScrumBoardProps {
	project: Project;
}

export function ScrumBoard({ project }: ScrumBoardProps) {
	return (
		<div className="h-full">
			<DragDropContext onDragEnd={() => {}}>
				<Tabs defaultValue={project.sprints[0]?.id.toString()}>
					<TabsList>
						{project.sprints.map((sprint) => (
							<TabsTrigger key={sprint.id} value={sprint.id.toString()}>
								{sprint.title}
							</TabsTrigger>
						))}
					</TabsList>
					{project.sprints.map((sprint) => (
						<TabsContent key={sprint.id} value={sprint.id.toString()}>
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<div>
											<CardTitle>{sprint.title}</CardTitle>
											<div className="mt-1 flex items-center text-muted-foreground text-sm">
												<Calendar className="mr-2 h-4 w-4" />
												{sprint.startDate &&
													new Date(sprint.startDate).toLocaleDateString()}
												-{' '}
												{sprint.endDate &&
													new Date(sprint.endDate).toLocaleDateString()}
											</div>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
										{project.scrumBoard.map((column) => (
											<Card key={column.id}>
												<CardHeader>
													<ColumnHeader
														title={column.title}
														count={
															column.tasks.filter(
																(task) => task.sprintId === sprint.id
															).length
														}
													/>
												</CardHeader>
												<CardContent>
													<Droppable droppableId={column.id}>
														{(provided) => (
															<ScrollArea
																className="h-[400px]"
																{...provided.droppableProps}
																ref={provided.innerRef}
															>
																{column.tasks
																	.filter((task) => task.sprintId === sprint.id)
																	.map((task, index) => (
																		<Draggable
																			key={task.id}
																			draggableId={task.id}
																			index={index}
																		>
																			{(provided) => (
																				<div
																					ref={provided.innerRef}
																					{...provided.draggableProps}
																					{...provided.dragHandleProps}
																				>
																					<TaskCard task={task} />
																				</div>
																			)}
																		</Draggable>
																	))}
																{provided.placeholder}
															</ScrollArea>
														)}
													</Droppable>
												</CardContent>
											</Card>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					))}
				</Tabs>
			</DragDropContext>
		</div>
	);
}
