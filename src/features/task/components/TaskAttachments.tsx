'use client';

import {
	Download,
	File,
	FileImage,
	FileText,
	Loader2,
	Paperclip,
	Trash2
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import { Progress } from '~/common/components/ui/progress';
import { UploadDropzone } from '~/common/utils/uploadthing';
import { useTaskAttachments } from '~/features/task/hooks/useTaskAttachments';
import {
	MAX_TASK_ATTACHMENT_SIZE_BYTES,
	getFileExtension,
	isAllowedAttachmentExtension
} from '~/features/task/schemas/taskAttachment.schema';
import { cn } from '~/lib/utils';

interface TaskAttachmentsProps {
	taskId?: string;
	isEditing: boolean;
}

function AttachmentTypeIcon({ fileName }: { fileName: string }) {
	const extension = getFileExtension(fileName);
	if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(extension)) {
		return <FileImage className="h-4 w-4 shrink-0 text-muted-foreground" />;
	}
	if (['.md', '.pdf', '.doc', '.docx'].includes(extension)) {
		return <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />;
	}
	return <File className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

export function TaskAttachments({ taskId, isEditing }: TaskAttachmentsProps) {
	const enabled = isEditing && Boolean(taskId);
	const {
		attachments,
		isLoading,
		createMutation,
		deleteMutation,
		canUpload,
		maxAttachments
	} = useTaskAttachments({
		taskId: taskId ?? '',
		enabled
	});
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);

	if (!isEditing || !taskId) {
		return (
			<div className="opacity-50">
				<h3 className="mb-3 font-medium text-muted-foreground text-sm">
					<Paperclip className="mr-1 inline h-4 w-4" />
					Attachments (0/{maxAttachments})
				</h3>
				<p className="rounded-md border border-border border-dashed p-4 text-center text-muted-foreground text-sm">
					Attachments will be available after creating the task
				</p>
			</div>
		);
	}

	return (
		<div>
			<h3 className="mb-3 font-medium text-muted-foreground text-sm">
				<Paperclip className="mr-1 inline h-4 w-4" />
				Attachments ({attachments.length}/{maxAttachments})
			</h3>

			<div className="space-y-3">
				{isLoading ? (
					<div className="flex items-center gap-2 text-muted-foreground text-sm">
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading attachments...
					</div>
				) : attachments.length === 0 ? (
					<p className="rounded-md border border-border border-dashed p-4 text-center text-muted-foreground text-sm">
						No attachments yet. Upload .md, PDF, Word, or image files (max 10MB
						each).
					</p>
				) : (
					<ul className="space-y-2">
						{attachments.map((attachment) => {
							const isDeleting =
								deleteMutation.isPending &&
								deleteMutation.variables?.id === attachment.id;

							return (
								<li
									key={attachment.id}
									className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
								>
									<AttachmentTypeIcon fileName={attachment.originalFileName} />
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium text-sm">
											{attachment.displayName}
										</p>
										<p className="truncate text-muted-foreground text-xs">
											Uploaded by{' '}
											{attachment.uploader.name || attachment.uploader.email}
										</p>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-8 w-8 shrink-0"
										asChild
									>
										<a
											href={attachment.url}
											download={attachment.displayName}
											target="_blank"
											rel="noopener noreferrer"
											aria-label={`Download ${attachment.displayName}`}
										>
											<Download className="h-4 w-4" />
										</a>
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-8 w-8 shrink-0 text-destructive"
										disabled={isDeleting}
										onClick={() => deleteMutation.mutate({ id: attachment.id })}
										aria-label={`Delete ${attachment.displayName}`}
									>
										{isDeleting ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Trash2 className="h-4 w-4" />
										)}
									</Button>
								</li>
							);
						})}
					</ul>
				)}

				{canUpload ? (
					<div className="space-y-2">
						<UploadDropzone
							endpoint="taskAttachment"
							config={{ mode: 'auto' }}
							appearance={{
								container: cn(
									'border-border! ut-uploading:opacity-60',
									'rounded-md border border-dashed p-4'
								),
								label: 'text-sm text-foreground',
								allowedContent: 'text-muted-foreground text-xs'
							}}
							content={{
								label: 'Drop files or click to upload',
								allowedContent: `.md, PDF, Word, images · max 10MB · ${attachments.length}/${maxAttachments}`
							}}
							onBeforeUploadBegin={(files) => {
								const allowed = files.filter((file) => {
									if (!isAllowedAttachmentExtension(file.name)) {
										toast.error(`File type not allowed: ${file.name}`);
										return false;
									}
									if (file.size > MAX_TASK_ATTACHMENT_SIZE_BYTES) {
										toast.error(`File too large (max 10MB): ${file.name}`);
										return false;
									}
									return true;
								});

								const remaining = maxAttachments - attachments.length;
								if (allowed.length > remaining) {
									toast.error(
										`Only ${remaining} more attachment${remaining === 1 ? '' : 's'} allowed`
									);
									return allowed.slice(0, remaining);
								}
								return allowed;
							}}
							onUploadBegin={() => {
								setIsUploading(true);
								setUploadProgress(0);
							}}
							onUploadProgress={(progress) => {
								setUploadProgress(progress);
							}}
							onClientUploadComplete={(res) => {
								setIsUploading(false);
								if (!res?.length) return;

								for (const file of res) {
									createMutation.mutate({
										taskId,
										url: file.ufsUrl,
										key: file.key,
										originalFileName: file.name,
										displayName: file.name,
										contentType: file.type || 'application/octet-stream',
										sizeBytes: file.size
									});
								}
							}}
							onUploadError={(error) => {
								setIsUploading(false);
								toast.error(error.message || 'Failed to upload attachment');
							}}
						/>
						{isUploading && (
							<div className="space-y-1">
								<Progress value={uploadProgress} className="h-2" />
								<p className="text-center text-muted-foreground text-xs">
									Uploading... {Math.round(uploadProgress)}%
								</p>
							</div>
						)}
					</div>
				) : (
					<p className="text-muted-foreground text-xs">
						Maximum of {maxAttachments} attachments reached.
					</p>
				)}
			</div>
		</div>
	);
}
