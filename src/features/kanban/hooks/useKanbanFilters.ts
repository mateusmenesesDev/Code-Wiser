import { TaskPriorityEnum } from "@prisma/client";
import { useQueryStates } from "nuqs";
import { useMemo } from "react";
import { z } from "zod";
import type { KanbanDataOutput } from "~/server/api/routers/kanban/types";

export const useKanbanFilters = () => {
    const [kanbanFilters, setKanbanFilters] = useQueryStates({
        sprint: z.string().optional(),
        priority: z.nativeEnum(TaskPriorityEnum).optional(),
        assignee: z.string().optional()
    });

    // Normalize "undefined" strings from URL to actual undefined
    const sprint = kanbanFilters.sprint === 'undefined' || kanbanFilters.sprint === '' ? undefined : kanbanFilters.sprint;
    const priority = kanbanFilters.priority; // Enum, can't be "undefined" string
    const assignee = kanbanFilters.assignee === 'undefined' || kanbanFilters.assignee === '' ? undefined : kanbanFilters.assignee;

    const hasActiveFilters = useMemo(() => {
        return sprint !== undefined || priority !== undefined || assignee !== undefined;
    }, [sprint, priority, assignee]);
    
    const filterTasks = (tasks: KanbanDataOutput | undefined) => {
        if (!tasks) return [];
        return tasks.filter((task) => {
            if (sprint && sprint !== 'all' && task.sprint?.id !== sprint) return false;
            if (priority && task.priority !== priority) return false;
            if (assignee && assignee !== 'all' && task.assignee?.id !== assignee) return false;
            return true;
        });
    };

    return {
        sprintFilter: sprint,
        priorityFilter: priority,
        assigneeFilter: assignee,
        setSprintFilter: (sprint: string) => {
            setKanbanFilters({ 
                ...kanbanFilters, 
                sprint: sprint === 'all' ? undefined : sprint 
            });
        },
        setPriorityFilter: (priority: TaskPriorityEnum | 'all') => {
            setKanbanFilters({ 
                ...kanbanFilters, 
                priority: priority === 'all' ? undefined : priority 
            });
        },
        setAssigneeFilter: (assignee: string) => {
            setKanbanFilters({ 
                ...kanbanFilters, 
                assignee: assignee === 'all' ? undefined : assignee 
            });
        },
        clearFilters: () => {
            setKanbanFilters({ sprint: undefined, priority: undefined, assignee: undefined });
        },
        hasActiveFilters,
        filterTasks
    };
};