'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import { Card } from '~/common/components/ui/card';
import { Progress } from '~/common/components/ui/progress';
import { UploadDropzone } from '~/common/utils/uploadthing';
import { api } from '~/trpc/react';

interface EditTemplateImagesProps {
	templateId: string;
}

export default function EditTemplateImages({
	templateId
}: EditTemplateImagesProps) {
	const utils = api.useUtils();
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);

	const { data: images } = api.projectTemplate.getImages.useQuery({
		projectTemplateId: templateId
	});

	const createImageMutation = api.projectTemplate.createImage.useMutation({
		onSuccess: () => {
			toast.success('Images uploaded successfully');
			utils.projectTemplate.getImages.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to upload images');
		}
	});

	const deleteImageMutation = api.projectTemplate.deleteImage.useMutation({
		onSuccess: () => {
			toast.success('Image deleted successfully');
			utils.projectTemplate.getImages.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to delete image');
		}
	});

	const handleDeleteImage = (imageId: string) => {
		deleteImageMutation.mutate({
			id: imageId
		});
	};

	return (
		<div className="space-y-6">
			<Card className="p-6">
				<h2 className="mb-4 font-semibold text-xl">Upload Images</h2>
				<div className="space-y-4">
					<UploadDropzone
						endpoint="imageUploader"
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
									order: (images?.length ?? 0) + index,
									uploadId: file.key
								}))
							});
						}}
						onUploadError={(error) => {
							setIsUploading(false);
							toast.error(error.message || 'Failed to upload images');
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
				<h2 className="mb-4 font-semibold text-xl">Current Images</h2>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
					{images?.map((image) => (
						<div key={image.url} className="group relative">
							<img
								src={image.url}
								alt={image.alt || 'Project image'}
								className="aspect-video w-full rounded-md object-cover"
							/>
							<Button
								variant="destructive"
								size="icon"
								className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
								onClick={() => handleDeleteImage(image.id)}
								disabled={
									deleteImageMutation.variables?.id === image.id &&
									deleteImageMutation.isPending
								}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					))}
				</div>
				{images?.length === 0 && (
					<p className="text-center text-muted-foreground">
						No images uploaded yet
					</p>
				)}
			</Card>
		</div>
	);
}
