import { atom } from 'jotai';
import type { RouterOutputs } from '~/trpc/react';

type Task =
	RouterOutputs['sprint']['getAllByProjectId'][number]['tasks'][number];

export const allTasksAtom = atom<Task[]>([]);
