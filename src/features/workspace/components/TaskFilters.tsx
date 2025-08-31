import { Filter, X } from 'lucide-react';
import { Button } from '~/common/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import { useTaskFiltersUrl } from '../hooks/useTaskFiltersUrl';

export function TaskFilters() {
	const {
		filters,
		filterOptions,
		hasActiveFilters,
		updateFilter,
		clearFilters,
		totalTasks,
		filteredCount
	} = useTaskFiltersUrl();

	return (
		<div className="w-full">
			<div className="mb-3 rounded-lg border bg-card/30 p-3">
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2">
						<Filter className="h-4 w-4 text-muted-foreground" />
						<span className="font-medium text-sm">Filters:</span>
					</div>

					<Select
						value={filters.sprint}
						onValueChange={(value) => updateFilter('sprint', value)}
					>
						<SelectTrigger className="w-48">
							<SelectValue placeholder="All Sprints" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Sprints</SelectItem>
							{filterOptions.sprints.map((sprint) => (
								<SelectItem key={sprint.id} value={sprint.id}>
									{sprint.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={filters.priority}
						onValueChange={(value) => updateFilter('priority', value)}
					>
						<SelectTrigger className="w-36">
							<SelectValue placeholder="All Priorities" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Priorities</SelectItem>
							{filterOptions.priorities.map((priority) => (
								<SelectItem key={priority} value={priority}>
									{priority}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={filters.assignee}
						onValueChange={(value) => updateFilter('assignee', value)}
					>
						<SelectTrigger className="w-36">
							<SelectValue placeholder="All Users" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Users</SelectItem>
							{filterOptions.assignees?.map(({ assigneeId, name }) => (
								<SelectItem key={assigneeId} value={assigneeId}>
									{name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{hasActiveFilters && (
						<Button variant="outline" size="sm" onClick={clearFilters}>
							<X className="mr-2 h-4 w-4" />
							Clear Filters
						</Button>
					)}
				</div>

				{hasActiveFilters && (
					<div className="mt-1 text-muted-foreground text-xs">
						Showing {filteredCount} of {totalTasks} tasks
					</div>
				)}
			</div>
		</div>
	);
}
