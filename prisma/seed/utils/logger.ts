type LogLevel =
	| 'info'
	| 'success'
	| 'error'
	| 'progress'
	| 'detail'
	| 'summary';

/*
 * Emojis provide visual distinction between different types of log messages,
 * making it easier to scan logs and identify message types at a glance
 */
const LOG_LEVEL_EMOJI: Record<LogLevel, string> = {
	info: '🌱',
	success: '✅',
	error: '❌',
	progress: '📊',
	detail: '📝',
	summary: '📋'
};

const formatLogMessage = (
	level: LogLevel,
	message: string,
	indent = 0
): string => {
	const indentation = '  '.repeat(indent);
	return `${indentation}${LOG_LEVEL_EMOJI[level]} ${message}`;
};

export const seedLogger = {
	info: (message: string, indent = 0): void => {
		console.log(formatLogMessage('info', message, indent));
	},

	success: (message: string, indent = 0): void => {
		console.log(formatLogMessage('success', message, indent));
	},

	error: (message: string | Error, error?: Error): void => {
		if (error) {
			console.error(formatLogMessage('error', message as string));
			console.error(error);
		} else {
			console.error(
				formatLogMessage(
					'error',
					message instanceof Error ? message.message : message
				)
			);
			if (message instanceof Error) {
				console.error(message);
			}
		}
	},

	progress: (current: number, total: number, type: string): void => {
		const percentage = Math.round((current / total) * 100);
		const bar = `${'='.repeat(Math.floor(percentage / 2))}>${' '.repeat(50 - Math.floor(percentage / 2))}`;
		console.log(
			formatLogMessage(
				'progress',
				`[${bar}] ${percentage}% | ${current}/${total} ${type}`
			)
		);
	},

	detail: (message: string, indent = 0): void => {
		console.log(formatLogMessage('detail', message, indent));
	},

	summary: (data: Record<string, unknown>): void => {
		console.log(formatLogMessage('summary', 'Generation Summary:'));

		for (const [key, value] of Object.entries(data)) {
			if (typeof value === 'object' && value !== null) {
				console.log(formatLogMessage('detail', `${key}:`, 1));
				for (const [subKey, subValue] of Object.entries(value)) {
					if (Array.isArray(subValue)) {
						console.log(formatLogMessage('detail', `${subKey}:`, 2));
						for (const item of subValue) {
							console.log(formatLogMessage('detail', item, 3));
						}
					} else {
						console.log(
							formatLogMessage('detail', `${subKey}: ${subValue}`, 2)
						);
					}
				}
			} else {
				console.log(formatLogMessage('detail', `${key}: ${value}`, 1));
			}
		}
	}
};
