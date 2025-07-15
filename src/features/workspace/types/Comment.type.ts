import type { RouterOutputs } from '~/trpc/react';

export type CommentsApiOutput = RouterOutputs['comment']['getByTaskId'];
