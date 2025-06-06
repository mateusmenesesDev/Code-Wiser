import { useState } from 'react';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';

interface ProjectImageGalleryProps {
	images?: string[];
	projectTitle: string;
}

export function ProjectImageGallery({
	images = [],
	projectTitle
}: ProjectImageGalleryProps) {
	const [selectedImage, setSelectedImage] = useState(0);

	// Default placeholder images if none provided
	const defaultImages = [
		'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
		'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
		'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800',
		'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800'
	];

	const displayImages = images.length > 0 ? images : defaultImages;

	return (
		<Card className="animate-slide-up overflow-hidden shadow-lg">
			<CardHeader>
				<CardTitle className="text-xl">Project Preview</CardTitle>
			</CardHeader>
			<CardContent className="p-6">
				{/* Main Image */}
				<div className="mb-4 overflow-hidden rounded-xl">
					<img
						src={displayImages[selectedImage]}
						alt={`${projectTitle} preview`}
						className="h-64 w-full object-cover"
					/>
				</div>

				{/* Thumbnail Gallery */}
				<div className="grid grid-cols-4 gap-3">
					{displayImages.map((image, index) => (
						<button
							key={`thumbnail-${image.slice(-20)}-${index}`}
							type="button"
							onClick={() => setSelectedImage(index)}
							className={`overflow-hidden rounded-lg border-2 transition-all ${
								selectedImage === index
									? 'border-blue-500 ring-2 ring-blue-200'
									: 'border-gray-200 hover:border-blue-300'
							}`}
						>
							<img
								src={image}
								alt={`${projectTitle} preview ${index + 1}`}
								className="h-16 w-full object-cover"
							/>
						</button>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
