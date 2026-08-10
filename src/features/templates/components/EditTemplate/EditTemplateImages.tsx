'use client';

import {
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors
} from '@dnd-kit/core';
import {
	SortableContext,
	arrayMove,
	rectSortingStrategy,
	sortableKeyboardCoordinates,
	useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import { Card } from '~/common/components/ui/card';
import { Progress } from '~/common/components/ui/progress';
import { IMAGE_UPLOADER_MAX_FILE_COUNT } from '~/common/constants/uploadthing';
import { handleUploadError } from '~/common/utils/uploadError';
import { UploadDropzone } from '~/common/utils/uploadthing';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';

interface EditTemplateImagesProps {
	templateId: string;
}

type TemplateImage = {
	id: string;
	url: string;
	alt: string | null;
	order: number;
};

function SortableImageCard({
	image,
	index,
	onDelete,
	isDeleting
}: {
	image: TemplateImage;
	index: number;
	onDelete: (id: string) => void;
	isDeleting: boolean;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging
	} = useSortable({ id: image.id });

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition
			}}
			className={cn(
				'group relative',
				isDragging && 'z-10 opacity-70 shadow-lg'
			)}
		>
			<img
				src={image.url}
				alt={image.alt || 'Project image'}
				className="aspect-video w-full rounded-md object-cover"
			/>
			{index === 0 && (
				<span className="absolute top-2 left-2 rounded bg-background/90 px-2 py-0.5 font-medium text-xs shadow">
					Cover
				</span>
			)}
			<button
				type="button"
				className="absolute bottom-2 left-2 flex h-7 w-7 cursor-grab items-center justify-center rounded-md bg-background/90 text-muted-foreground shadow active:cursor-grabbing"
				aria-label={`Drag to reorder image ${index + 1}`}
				{...attributes}
				{...listeners}
			>
				<GripVertical className="h-4 w-4" />
			</button>
			<Button
				variant="destructive"
				size="icon"
				className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
				onClick={() => onDelete(image.id)}
				disabled={isDeleting}
			>
				<X className="h-4 w-4" />
			</Button>
		</div>
	);
}

export default function EditTemplateImages({
	templateId
}: EditTemplateImagesProps) {
	const utils = api.useUtils();
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const [orderedImages, setOrderedImages] = useState<TemplateImage[]>([]);

	const { data: images } = api.projectTemplate.getImages.useQuery({
		projectTemplateId: templateId
	});

	useEffect(() => {
		if (images) {
			setOrderedImages(images);
		}
	}, [images]);

	const invalidateImageQueries = () => {
		utils.projectTemplate.getImages.invalidate({
			projectTemplateId: templateId
		});
		utils.projectTemplate.getById.invalidate();
		utils.projectTemplate.getApproved.invalidate();
	};

	const createImageMutation = api.projectTemplate.createImage.useMutation({
		onSuccess: () => {
			toast.success('Images uploaded successfully');
			invalidateImageQueries();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to upload images');
		}
	});

	const deleteImageMutation = api.projectTemplate.deleteImage.useMutation({
		onSuccess: () => {
			toast.success('Image deleted successfully');
			invalidateImageQueries();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to delete image');
		}
	});

	const reorderImagesMutation = api.projectTemplate.reorderImages.useMutation({
		onSuccess: () => {
			invalidateImageQueries();
		},
		onError: (error) => {
			if (images) {
				setOrderedImages(images);
			}
			toast.error(error.message || 'Failed to reorder images');
		}
	});

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 6 }
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates
		})
	);

	const handleDeleteImage = (imageId: string) => {
		deleteImageMutation.mutate({
			id: imageId
		});
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = orderedImages.findIndex((image) => image.id === active.id);
		const newIndex = orderedImages.findIndex((image) => image.id === over.id);
		if (oldIndex < 0 || newIndex < 0) return;

		const nextImages = arrayMove(orderedImages, oldIndex, newIndex).map(
			(image, order) => ({ ...image, order })
		);
		setOrderedImages(nextImages);

		reorderImagesMutation.mutate({
			projectTemplateId: templateId,
			items: nextImages.map((image) => ({
				id: image.id,
				order: image.order
			}))
		});
	};

	const nextUploadOrder =
		orderedImages.length > 0
			? Math.max(...orderedImages.map((image) => image.order)) + 1
			: 0;

	return (
		<div className="space-y-6">
			<Card className="p-6">
				<h2 className="mb-4 font-semibold text-xl">Upload Images</h2>
				<div className="space-y-4">
					<UploadDropzone
						endpoint="imageUploader"
						content={{
							label: 'Drop images or click to upload',
							allowedContent: `Images up to 4MB, max ${IMAGE_UPLOADER_MAX_FILE_COUNT} per upload`
						}}
						onBeforeUploadBegin={(files) => {
							if (files.length <= IMAGE_UPLOADER_MAX_FILE_COUNT) {
								return files;
							}

							toast.error(
								`You can upload at most ${IMAGE_UPLOADER_MAX_FILE_COUNT} images at a time. Only the first ${IMAGE_UPLOADER_MAX_FILE_COUNT} will be uploaded.`
							);
							return files.slice(0, IMAGE_UPLOADER_MAX_FILE_COUNT);
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

							createImageMutation.mutate({
								projectTemplateId: templateId,
								images: res.map((file, index) => ({
									url: file.ufsUrl,
									alt: file.name,
									order: nextUploadOrder + index,
									uploadId: file.key
								}))
							});
						}}
						onUploadError={(error) => {
							setIsUploading(false);
							handleUploadError(error, 'Failed to upload images');
						}}
					/>
					{isUploading && (
						<div className="space-y-2">
							<Progress value={uploadProgress} className="h-2" />
							<p className="text-center text-muted-foreground text-sm">
								Uploading... {Math.round(uploadProgress)}%
							</p>
						</div>
					)}
				</div>
			</Card>

			<Card className="p-6">
				<div className="mb-4 space-y-1">
					<h2 className="font-semibold text-xl">Current Images</h2>
					<p className="text-muted-foreground text-sm">
						Drag images to change their order. The first image is used as the
						cover.
					</p>
				</div>
				{orderedImages.length > 0 ? (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={orderedImages.map((image) => image.id)}
							strategy={rectSortingStrategy}
						>
							<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
								{orderedImages.map((image, index) => (
									<SortableImageCard
										key={image.id}
										image={image}
										index={index}
										onDelete={handleDeleteImage}
										isDeleting={
											deleteImageMutation.variables?.id === image.id &&
											deleteImageMutation.isPending
										}
									/>
								))}
							</div>
						</SortableContext>
					</DndContext>
				) : (
					<p className="text-center text-muted-foreground">
						No images uploaded yet
					</p>
				)}
			</Card>
		</div>
	);
}
