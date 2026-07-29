import * as Sentry from '@sentry/nextjs';
import { toast } from 'sonner';

/** Client-visible validation / auth failures — keep out of Sentry noise. */
const EXPECTED_UPLOAD_MESSAGE =
	/Invalid config:|You uploaded \d+ file|Unauthorized|file that was .+ but the limit|must be logged in/i;

export function handleUploadError(
	error: { message?: string },
	fallback = 'Upload failed'
) {
	const message = error.message?.trim() || fallback;
	toast.error(message);

	if (EXPECTED_UPLOAD_MESSAGE.test(message)) {
		return;
	}

	Sentry.captureException(
		error instanceof Error ? error : new Error(message),
		{
			tags: { source: 'uploadthing' },
			level: 'error'
		}
	);
}
