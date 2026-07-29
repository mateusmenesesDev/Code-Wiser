import { auth } from '@clerk/nextjs/server';
import { type FileRouter, createUploadthing } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { IMAGE_UPLOADER_MAX_FILE_COUNT } from '~/common/constants/uploadthing';

const f = createUploadthing({
	/**
	 * UploadThing defaults to `Invalid config: FileCountMismatch` (tag only).
	 * Prefer the detailed `cause` reason when present so the client toast is actionable.
	 */
	errorFormatter: (err) => {
		const causeMessage =
			err.cause instanceof Error ? err.cause.message : null;
		const useCause =
			Boolean(causeMessage) && err.message.startsWith('Invalid config:');

		return {
			message: useCause && causeMessage ? causeMessage : err.message
		};
	}
});

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
	// Define as many FileRoutes as you like, each with a unique routeSlug
	imageUploader: f({
		image: {
			/**
			 * For full list of options and defaults, see the File Route API reference
			 * @see https://docs.uploadthing.com/file-routes#route-config
			 */
			maxFileSize: '4MB',
			maxFileCount: IMAGE_UPLOADER_MAX_FILE_COUNT
		}
	})
		// Set permissions and file types for this FileRoute
		.middleware(async () => {
			// This code runs on your server before upload
			const { userId } = auth();

			if (!userId) throw new UploadThingError('Unauthorized');

			return { userId };
		})
		.onUploadComplete(async ({ metadata }) => {
			return { uploadedBy: metadata.userId };
		}),
	feedbackScreenshot: f({
		image: {
			maxFileSize: '4MB',
			maxFileCount: 1
		}
	})
		.middleware(async () => {
			const { userId } = auth();

			if (!userId) throw new UploadThingError('Unauthorized');

			return { userId };
		})
		.onUploadComplete(async ({ metadata }) => {
			return { uploadedBy: metadata.userId };
		}),
	// UploadThing sizes are power-of-two; 16MB is the nearest allowed above our 10MB app limit.
	// App-level Zod/client validation still enforces 10MB and allowed extensions.
	taskAttachment: f({
		image: { maxFileSize: '16MB', maxFileCount: 5 },
		pdf: { maxFileSize: '16MB', maxFileCount: 5 },
		text: { maxFileSize: '16MB', maxFileCount: 5 },
		blob: { maxFileSize: '16MB', maxFileCount: 5 },
		'application/msword': { maxFileSize: '16MB', maxFileCount: 5 },
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
			maxFileSize: '16MB',
			maxFileCount: 5
		},
		'text/markdown': { maxFileSize: '16MB', maxFileCount: 5 }
	})
		.middleware(async () => {
			const { userId } = auth();

			if (!userId) throw new UploadThingError('Unauthorized');

			return { userId };
		})
		.onUploadComplete(async ({ metadata }) => {
			return { uploadedBy: metadata.userId };
		})
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
