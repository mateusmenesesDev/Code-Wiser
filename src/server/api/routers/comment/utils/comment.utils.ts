import type { ResourceAccessContext } from '~/server/utils/auth';
import { assertTaskAccess } from '~/server/utils/auth';

export const checkUserHasAccessToTask = async (
	ctx: ResourceAccessContext,
	taskId: string
): Promise<boolean> => {
	await assertTaskAccess(ctx, taskId);
	return true;
};
