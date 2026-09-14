type RemediationActionLink = {
	targetType: 'TASK' | 'EXERCISE' | 'MENTORSHIP';
	task?: { id: string; projectId: string | null } | null;
	challenge?: { slug: string; track: { slug: string } } | null;
};

export function getRemediationActionHref(action: RemediationActionLink) {
	if (action.targetType === 'TASK' && action.task?.projectId) {
		return `/workspace/${action.task.projectId}?taskId=${action.task.id}`;
	}
	if (action.targetType === 'EXERCISE' && action.challenge) {
		return `/exercises/${action.challenge.track.slug}/${action.challenge.slug}`;
	}
	return action.targetType === 'MENTORSHIP' ? '/mentorship' : '/';
}
