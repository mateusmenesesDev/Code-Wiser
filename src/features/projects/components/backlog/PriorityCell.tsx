import { TaskPriorityEnum } from '@prisma/client';
import { Badge } from '~/common/components/badge';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/common/components/dropdown-menu';
import { useTask } from '~/features/tasks/hooks/useTask';

const getPriorityVariant = (priority: TaskPriorityEnum | string) => {
	switch (priority) {
		case 'HIGHEST':
			return 'destructive';
		case 'HIGH':
			return 'default';
		case 'MEDIUM':
			return 'warning';
		case 'LOW':
			return 'outline';
		default:
			return 'outline';
	}
};

export function PriorityCell({
	priority,
	taskId
}: {
	priority: TaskPriorityEnum | string;
	taskId: string;
}) {
	const { updateTaskPriority } = useTask();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Badge
					variant={getPriorityVariant(priority)}
					className="w-[100px] cursor-pointer justify-center hover:opacity-90"
				>
					{priority ?? 'NO PRIORITY'}
				</Badge>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-[100px]">
				{Object.values(TaskPriorityEnum).map((priority) => (
					<DropdownMenuItem
						key={priority}
						onClick={() => updateTaskPriority(taskId, priority)}
					>
						<Badge
							variant={getPriorityVariant(priority)}
							className="w-full justify-center"
						>
							{priority}
						</Badge>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
