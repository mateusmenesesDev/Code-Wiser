import { TRPCError } from '@trpc/server';
import {
	MAX_TASK_ATTACHMENTS,
	createTaskAttachmentSchema,
	deleteTaskAttachmentSchema,
	getTaskAttachmentsSchema,
	renameTaskAttachmentSchema,
	replaceTaskAttachmentSchema
} from '~/features/task/schemas/taskAttachment.schema';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import {
	assertAllowedAttachmentFile,
	assertCanAccessTaskAttachments,
	deleteUploadThingFiles
} from './taskAttachment.utils';

const uploaderInclude = {
	uploader: {
		select: {
			id: true,
			name: true,
			email: true
		}
	}
} as const;

export const taskAttachmentRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createTaskAttachmentSchema)
		.mutation(async ({ ctx, input }) => {
			await assertCanAccessTaskAttachments(ctx, input.taskId);

			try {
				assertAllowedAttachmentFile({
					originalFileName: input.originalFileName,
					sizeBytes: input.sizeBytes
				});
			} catch (error) {
				await deleteUploadThingFiles([input.key]);
				throw error;
			}

			const count = await ctx.db.taskAttachment.count({
				where: { taskId: input.taskId }
			});

			if (count >= MAX_TASK_ATTACHMENTS) {
				await deleteUploadThingFiles([input.key]);
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: `A task can have at most ${MAX_TASK_ATTACHMENTS} attachments`
				});
			}

			return ctx.db.taskAttachment.create({
				data: {
					taskId: input.taskId,
					uploaderId: ctx.session.userId,
					url: input.url,
					key: input.key,
					originalFileName: input.originalFileName,
					displayName: input.displayName,
					contentType: input.contentType,
					sizeBytes: input.sizeBytes
				},
				include: uploaderInclude
			});
		}),

	getByTaskId: protectedProcedure
		.input(getTaskAttachmentsSchema)
		.query(async ({ ctx, input }) => {
			await assertCanAccessTaskAttachments(ctx, input.taskId);

			return ctx.db.taskAttachment.findMany({
				where: { taskId: input.taskId },
				include: uploaderInclude,
				orderBy: {
					createdAt: 'asc'
				}
			});
		}),

	rename: protectedProcedure
		.input(renameTaskAttachmentSchema)
		.mutation(async ({ ctx, input }) => {
			const attachment = await ctx.db.taskAttachment.findUnique({
				where: { id: input.id }
			});

			if (!attachment) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Attachment not found'
				});
			}

			await assertCanAccessTaskAttachments(ctx, attachment.taskId);

			return ctx.db.taskAttachment.update({
				where: { id: input.id },
				data: { displayName: input.displayName },
				include: uploaderInclude
			});
		}),

	replace: protectedProcedure
		.input(replaceTaskAttachmentSchema)
		.mutation(async ({ ctx, input }) => {
			const attachment = await ctx.db.taskAttachment.findUnique({
				where: { id: input.id }
			});

			if (!attachment) {
				await deleteUploadThingFiles([input.key]);
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Attachment not found'
				});
			}

			await assertCanAccessTaskAttachments(ctx, attachment.taskId);

			try {
				assertAllowedAttachmentFile({
					originalFileName: input.originalFileName,
					sizeBytes: input.sizeBytes
				});
			} catch (error) {
				await deleteUploadThingFiles([input.key]);
				throw error;
			}

			const previousKey = attachment.key;

			const updated = await ctx.db.taskAttachment.update({
				where: { id: input.id },
				data: {
					url: input.url,
					key: input.key,
					originalFileName: input.originalFileName,
					displayName: input.displayName,
					contentType: input.contentType,
					sizeBytes: input.sizeBytes
				},
				include: uploaderInclude
			});

			if (previousKey !== input.key) {
				await deleteUploadThingFiles([previousKey]);
			}

			return updated;
		}),

	delete: protectedProcedure
		.input(deleteTaskAttachmentSchema)
		.mutation(async ({ ctx, input }) => {
			const attachment = await ctx.db.taskAttachment.findUnique({
				where: { id: input.id },
				include: {
					task: {
						include: {
							project: true
						}
					}
				}
			});

			if (!attachment) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Attachment not found'
				});
			}

			await assertCanAccessTaskAttachments(ctx, attachment.taskId);
			await deleteUploadThingFiles([attachment.key]);
			await ctx.db.taskAttachment.delete({ where: { id: input.id } });

			return { success: true };
		})
});
