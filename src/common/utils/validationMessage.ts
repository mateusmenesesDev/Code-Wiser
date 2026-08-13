const validationKeys: Record<string, string> = {
	Required: 'required',
	'Name is required': 'nameRequired',
	'Last name is required': 'lastNameRequired',
	'Title is required': 'titleRequired',
	'Description is required': 'descriptionRequired',
	'Setup instructions are required': 'setupRequired',
	'Acceptance criteria are required': 'acceptanceRequired',
	'Slug must be kebab-case': 'slugKebabCase',
	'Repository URL must be a valid GitHub repository URL':
		'invalidGithubRepository',
	'PR URL must be a valid GitHub pull request URL': 'invalidGithubPullRequest',
	'Select at least one challenge': 'selectChallenge',
	'At least one task must be selected': 'atLeastOneTask',
	'Price ID is required for payment mode': 'priceIdRequired',
	'Subscription ID is required for subscription mode': 'subscriptionIdRequired',
	'End date is required if start date is provided': 'endDateRequired',
	'End date must be on or after the start date': 'endDateOrder',
	'Id is required': 'idRequired',
	'Comment content is required': 'commentRequired',
	'Task ID is required': 'taskIdRequired',
	'Comment ID is required': 'commentIdRequired',
	'File must be 10MB or smaller': 'fileSize',
	'Display name is required': 'displayNameRequired',
	'Project ID is required': 'projectIdRequired',
	'Sprint ID is required': 'sprintIdRequired',
	'Date must use YYYY-MM-DD': 'dateFormat',
	'Date must be a valid calendar date': 'invalidDate',
	'Category is required': 'categoryRequired',
	'At least one technology is required': 'technologyRequired',
	'Credits are required for credit-based projects': 'creditsRequired',
	'URL must use HTTP or HTTPS': 'httpUrl',
	'Invalid email address': 'invalidEmail',
	'Story points must be greater than 0': 'positiveStoryPoints',
	'Story points must follow the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21)':
		'fibStoryPoints',
	'Story points must be a Fibonacci value: 1, 2, 3, 5, 8, 13, or 21':
		'fibStoryPoints'
};

export function validationMessageKey(message: string) {
	return validationKeys[message];
}
