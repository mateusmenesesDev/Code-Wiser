/**
 * Project and template utility functions
 */

export const formatTemplateStatus = (status: string) => {
	switch (status) {
		case 'APPROVED':
			return 'Published';
		case 'PENDING':
			return 'Draft';
		case 'REJECTED':
			return 'Rejected';
		case 'REQUESTED_CHANGES':
			return 'Changes Requested';
		case 'SEND_FOR_APPROVAL':
			return 'Pending Approval';
		default:
			return status;
	}
};

export const getAccessTypeIcon = (accessType: 'Free' | 'Credits') => {
	switch (accessType) {
		case 'Free':
			return '🎁';
		case 'Credits':
			return '⚡';
		default:
			return null;
	}
};
