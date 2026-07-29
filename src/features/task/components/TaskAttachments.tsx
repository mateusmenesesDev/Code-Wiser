'use client';

import {
	Download,
	File,
	FileImage,
	FileText,
	Loader2,
	Paperclip,
	Pencil,
	RefreshCw,
	Trash2,
	X
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import { Input } from '~/common/components/ui/input';
import { Progress } from '~/common/components/ui/progress';
import { UploadDropzone, uploadFiles } from '~/common/utils/uploadthing';
import { useTaskAttachments } from '~/features/task/hooks/useTaskAttachments';
import {
	MAX_TASK_ATTACHMENTS,
	MAX_TASK_ATTACHMENT_SIZE_BYTES,
	getFileExtension,
	isAllowedAttachmentExtension
} from '~/features/task/schemas/taskAttachment.schema';
import { cn } from '~/lib/utils';

interface TaskAttachmentsProps {
	taskId?: string;
	isEditing: boolean;
	stagedFiles?: File[];
	onStagedFilesChange?: (files: File[]) => void;
	isUploadingStaged?: boolean;
	stagedUploadProgress?: number;
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

function filterValidFiles(files: File[], alreadyCount: number): File[] {
	const allowed: File[] = [];

	for (const file of files) {
		if (!isAllowedAttachmentExtension(file.name)) {
			toast.error(`File type not allowed: ${file.name}`);
			continue;
		}
		if (file.size > MAX_TASK_ATTACHMENT_SIZE_BYTES) {
			toast.error(`File too large (max 10MB): ${file.name}`);
			continue;
		}
		allowed.push(file);
	}

	const remaining = MAX_TASK_ATTACHMENTS - alreadyCount;
	if (allowed.length > remaining) {
		toast.error(
			`Only ${remaining} more attachment${remaining === 1 ? '' : 's'} allowed`
		);
		return allowed.slice(0, Math.max(0, remaining));
	}

	return allowed;
}

export function TaskAttachments({
	taskId,
	isEditing,
	stagedFiles = [],
	onStagedFilesChange,
	isUploadingStaged = false,
	stagedUploadProgress = 0
}: TaskAttachmentsProps) {
	const enabled = isEditing && Boolean(taskId);
	const {
		attachments,
		isLoading,
		createMutation,
		renameMutation,
		replaceMutation,
		deleteMutation,
		canUpload,
		maxAttachments
	} = useTaskAttachments({
		taskId: taskId ?? '',
		enabled
	});
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const [renamingId, setRenamingId] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState('');
	const [replacingId, setReplacingId] = useState<string | null>(null);
	const replaceInputRef = useRef<HTMLInputElement>(null);
	const stageInputRef = useRef<HTMLInputElement>(null);

	const startRename = (id: string, currentName: string) => {
		setRenamingId(id);
		setRenameValue(currentName);
	};

	const cancelRename = () => {
		setRenamingId(null);
		setRenameValue('');
	};

	const submitRename = () => {
		if (!renamingId) return;
		const trimmed = renameValue.trim();
		if (!trimmed) {
			toast.error('Display name is required');
			return;
		}
		renameMutation.mutate(
			{ id: renamingId, displayName: trimmed },
			{ onSuccess: cancelRename }
		);
	};

	const openReplacePicker = (attachmentId: string) => {
		setReplacingId(attachmentId);
		replaceInputRef.current?.click();
	};

	const handleReplaceFile = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		const attachmentId = replacingId;
		event.target.value = '';
		setReplacingId(null);

		if (!file || !attachmentId) return;

		if (!isAllowedAttachmentExtension(file.name)) {
			toast.error(`File type not allowed: ${file.name}`);
			return;
		}
		if (file.size > MAX_TASK_ATTACHMENT_SIZE_BYTES) {
			toast.error(`File too large (max 10MB): ${file.name}`);
			return;
		}

		try {
			setIsUploading(true);
			setUploadProgress(0);
			const [uploaded] = await uploadFiles('taskAttachment', {
				files: [file],
				onUploadProgress: ({ progress }) => {
					setUploadProgress(progress);
				}
			});

			if (!uploaded) {
				toast.error('Failed to upload replacement file');
				return;
			}

			await replaceMutation.mutateAsync({
				id: attachmentId,
				url: uploaded.ufsUrl,
				key: uploaded.key,
				originalFileName: uploaded.name,
				displayName: uploaded.name,
				contentType: uploaded.type || 'application/octet-stream',
				sizeBytes: uploaded.size
			});
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to replace attachment'
			);
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
		}
	};

	const handleStageFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
		const selected = Array.from(event.target.files ?? []);
		event.target.value = '';
		if (!selected.length || !onStagedFilesChange) return;

		const next = filterValidFiles(selected, stagedFiles.length);
		if (next.length === 0) return;
		onStagedFilesChange([...stagedFiles, ...next]);
	};

	const removeStagedFile = (index: number) => {
		if (!onStagedFilesChange) return;
		onStagedFilesChange(stagedFiles.filter((_, i) => i !== index));
	};

	if (!isEditing) {
		return (
			<div>
				<input
					ref={stageInputRef}
					type="file"
					className="hidden"
					multiple
					accept=".md,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif"
					onChange={handleStageFiles}
				/>

				<h3 className="mb-3 font-medium text-muted-foreground text-sm">
					<Paperclip className="mr-1 inline h-4 w-4" />
					Attachments ({stagedFiles.length}/{maxAttachments})
				</h3>

				<div className="space-y-3">
					{stagedFiles.length === 0 ? (
						<p className="rounded-md border border-border border-dashed p-4 text-center text-muted-foreground text-sm">
							Select files to attach. They upload after the task is created.
						</p>
					) : (
						<ul className="space-y-2">
							{stagedFiles.map((file, index) => (
								<li
									key={`${file.name}-${file.size}-${index}`}
									className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
								>
									<AttachmentTypeIcon fileName={file.name} />
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium text-sm">{file.name}</p>
										<p className="text-muted-foreground text-xs">
											Pending upload
										</p>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-8 w-8 shrink-0"
										disabled={isUploadingStaged}
										onClick={() => removeStagedFile(index)}
										aria-label={`Remove ${file.name}`}
									>
										<X className="h-4 w-4" />
									</Button>
								</li>
							))}
						</ul>
					)}

					{stagedFiles.length < maxAttachments && (
						<Button
							type="button"
							variant="outline"
							className="w-full"
							disabled={isUploadingStaged}
							onClick={() => stageInputRef.current?.click()}
						>
							Add files
						</Button>
					)}

					{isUploadingStaged && (
						<div className="space-y-1">
							<Progress value={stagedUploadProgress} className="h-2" />
							<p className="text-center text-muted-foreground text-xs">
								Uploading attachments... {Math.round(stagedUploadProgress)}%
							</p>
						</div>
					)}
				</div>
			</div>
		);
	}

	if (!taskId) {
		return null;
	}

	return (
		<div>
			<input
				ref={replaceInputRef}
				type="file"
				className="hidden"
				accept=".md,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif"
				onChange={handleReplaceFile}
			/>

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
							const isRenaming = renamingId === attachment.id;
							const isReplacing =
								(replacingId === attachment.id && isUploading) ||
								(replaceMutation.isPending &&
									replaceMutation.variables?.id === attachment.id);

							return (
								<li
									key={attachment.id}
									className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
								>
									<AttachmentTypeIcon fileName={attachment.originalFileName} />
									<div className="min-w-0 flex-1">
										{isRenaming ? (
											<div className="flex items-center gap-2">
												<Input
													value={renameValue}
													onChange={(e) => setRenameValue(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === 'Enter') {
															e.preventDefault();
															submitRename();
														}
														if (e.key === 'Escape') {
															cancelRename();
														}
													}}
													className="h-8"
													autoFocus
													disabled={renameMutation.isPending}
												/>
												<Button
													type="button"
													size="sm"
													onClick={submitRename}
													disabled={renameMutation.isPending}
												>
													{renameMutation.isPending ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														'Save'
													)}
												</Button>
												<Button
													type="button"
													size="sm"
													variant="ghost"
													onClick={cancelRename}
													disabled={renameMutation.isPending}
												>
													Cancel
												</Button>
											</div>
										) : (
											<>
												<p className="truncate font-medium text-sm">
													{attachment.displayName}
												</p>
												<p className="truncate text-muted-foreground text-xs">
													Uploaded by{' '}
													{attachment.uploader.name ||
														attachment.uploader.email}
												</p>
											</>
										)}
									</div>
									{!isRenaming && (
										<>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-8 w-8 shrink-0"
												onClick={() =>
													startRename(attachment.id, attachment.displayName)
												}
												aria-label={`Rename ${attachment.displayName}`}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-8 w-8 shrink-0"
												disabled={isReplacing || isUploading}
												onClick={() => openReplacePicker(attachment.id)}
												aria-label={`Replace ${attachment.displayName}`}
											>
												{isReplacing ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<RefreshCw className="h-4 w-4" />
												)}
											</Button>
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
												onClick={() =>
													deleteMutation.mutate({ id: attachment.id })
												}
												aria-label={`Delete ${attachment.displayName}`}
											>
												{isDeleting ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Trash2 className="h-4 w-4" />
												)}
											</Button>
										</>
									)}
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
								return filterValidFiles(files, attachments.length);
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
