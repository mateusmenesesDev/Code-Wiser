import { TaskPriorityEnum } from '@prisma/client';
import { ChevronDown } from 'lucide-react';
import { Badge } from '~/common/components/ui/badge';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/common/components/ui/dropdown-menu';
import { getBadgeTaskPriorityColor } from '~/common/utils/colorUtils';
import { useTask } from '~/features/workspace/hooks/useTask';

export function PriorityCell({
	priority,
	id,
	projectId
}: {
	priority: TaskPriorityEnum;
	id: string;
	isTemplate: boolean;
	projectId: string;
}) {
	const { updateTask } = useTask({
		projectId
	});

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Badge
					variant={getBadgeTaskPriorityColor(priority)}
					className="w-[100px] cursor-pointer justify-center"
				>
					{priority}
					<ChevronDown className="ml-1 h-4 w-4" />
				</Badge>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-[100px]">
				{Object.values(TaskPriorityEnum).map((priority) => (
					<DropdownMenuItem
						key={priority}
						onClick={() =>
							updateTask({
								id,
								priority: priority as TaskPriorityEnum
							})
						}
					>
						<Badge
							variant={getBadgeTaskPriorityColor(priority)}
							className="w-[100px] cursor-pointer justify-center"
						>
							{priority}
						</Badge>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
