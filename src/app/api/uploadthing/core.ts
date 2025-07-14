import { auth } from '@clerk/nextjs/server';
import { type FileRouter, createUploadthing } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';

const f = createUploadthing();

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
			maxFileCount: 10
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
		})
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
