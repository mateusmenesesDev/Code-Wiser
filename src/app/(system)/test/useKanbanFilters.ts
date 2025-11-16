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

    const { sprint, priority, assignee } = kanbanFilters;

    const hasActiveFilters = useMemo(() => {
        return sprint !== undefined || priority !== undefined || assignee !== undefined;
    }, [sprint, priority, assignee]);
    
    const filterTasks = (tasks: KanbanDataOutput | undefined) => {
        if (!tasks) return [];
        return tasks.filter((task) => {
            if (sprint && task.sprint?.id !== sprint) return false;
            if (priority && task.priority !== priority) return false;
            if (assignee && task.assignee?.id !== assignee) return false;
            return true;
        });
    };

    return {
        sprintFilter: sprint,
        priorityFilter: priority,
        assigneeFilter: assignee,
        setSprintFilter: (sprint: string) => {
            setKanbanFilters({ ...kanbanFilters, sprint });
        },
        setPriorityFilter: (priority: TaskPriorityEnum) => {
            setKanbanFilters({ ...kanbanFilters, priority });
        },
        setAssigneeFilter: (assignee: string) => {
            setKanbanFilters({ ...kanbanFilters, assignee });
        },
        clearFilters: () => {
            setKanbanFilters({ sprint: undefined, priority: undefined, assignee: undefined });
        },
        hasActiveFilters,
        filterTasks
    };
};