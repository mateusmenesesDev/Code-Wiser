import { TRPCError } from '@trpc/server';

export function assertDiagnosisComplete(completedAt: Date | null | undefined) {
	if (!completedAt) {
		throw new TRPCError({
			code: 'PRECONDITION_FAILED',
			message: 'Complete your learning diagnosis before starting an activity'
		});
	}
}
