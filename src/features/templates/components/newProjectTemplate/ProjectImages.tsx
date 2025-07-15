import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import type { UseFormReturn } from 'react-hook-form';
import { ErrorMessage } from '~/common/components/ErrorMessage';
import { Button } from '~/common/components/ui/button';
import { Label } from '~/common/components/ui/label';
import type { ProjectTemplateFormData } from '~/features/projects/types/Projects.type';

interface ProjectImagesProps {
	form: UseFormReturn<ProjectTemplateFormData>;
}

export function ProjectImages({ form }: ProjectImagesProps) {
	const {
		watch,
		setValue,
		formState: { errors }
	} = form;

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const files = Array.from(e.target.files);
			const newImages = files.map((file) => ({
				url: URL.createObjectURL(file),
				alt: file.name
			}));
			setValue('images', [...(watch('images') || []), ...newImages]);
		}
	};

	const removeImage = (index: number) => {
		const currentImages = watch('images');
		if (currentImages) {
			setValue(
				'images',
				currentImages.filter((_, i) => i !== index)
			);
		}
	};

	return (
		<div className="space-y-2">
			<Label>Project Images</Label>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
				{watch('images')?.map((image, index) => (
					<div key={image.url} className="relative aspect-square">
						<Image
							src={image.url}
							alt={`Project image ${index + 1}`}
							fill
							className="rounded-md object-cover"
						/>
						<Button
							type="button"
							variant="destructive"
							size="icon"
							className="absolute top-2 right-2 h-6 w-6 rounded-full p-0"
							onClick={() => removeImage(index)}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				))}
				<div className="flex aspect-square w-full items-center justify-center rounded-md border-2 border-dashed">
					<label htmlFor="image-upload" className="cursor-pointer">
						<Upload className="h-8 w-8 text-muted-foreground" />
						<span className="sr-only">Upload project image</span>
					</label>
					<input
						id="image-upload"
						type="file"
						multiple
						accept="image/*"
						className="hidden"
						onChange={handleImageUpload}
					/>
				</div>
			</div>
			<ErrorMessage message={errors.images?.message} />
		</div>
	);
}
