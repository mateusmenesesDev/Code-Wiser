import { atom } from 'jotai';
import type { RouterOutputs } from '~/trpc/react';

type Task =
	RouterOutputs['sprint']['getAllByProjectSlug'][number]['tasks'][number];

export const allTasksAtom = atom<Task[]>([]);
