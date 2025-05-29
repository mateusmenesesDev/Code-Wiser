import { atom } from 'jotai';
import type { RouterOutputs } from '~/trpc/react';

type Task =
	RouterOutputs['kanban']['getColumnsByProjectSlug'][number]['tasks'][number];

export const allTasksAtom = atom<Task[]>([]);
