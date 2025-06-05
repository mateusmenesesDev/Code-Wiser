export const getDifficultyColor = (difficulty: string) => {
	switch (difficulty) {
		case 'BEGINNER':
			return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
		case 'INTERMEDIATE':
			return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
		case 'ADVANCED':
			return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
		default:
			return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
	}
};

export const getAccessColor = (accessType: string) => {
	switch (accessType) {
		case 'Free':
			return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
		case 'Credits':
			return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
		default:
			return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
	}
};

export const getStatusColor = (status: string) => {
	switch (status) {
		case 'APPROVED':
			return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
		case 'PENDING':
			return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
		case 'REJECTED':
			return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
		case 'REQUESTED_CHANGES':
			return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
		default:
			return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
	}
};

export const formatStatus = (status: string) => {
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

export const getAccessType = (credits: number | null) => {
	return credits && credits > 0 ? 'Credits' : 'Free';
};
