import Image from 'next/image';
import { useState } from 'react';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';

interface ProjectImageGalleryProps {
	images?: {
		url: string;
		alt: string;
	}[];
	projectTitle: string;
}

export function ProjectImageGallery({
	images = [],
	projectTitle
}: ProjectImageGalleryProps) {
	const [selectedImage, setSelectedImage] = useState(0);

	return (
		<Card className="animate-slide-up overflow-hidden shadow-lg">
			<CardHeader>
				<CardTitle className="text-xl">Project Preview</CardTitle>
			</CardHeader>
			<CardContent className="p-6">
				{/* Main Image */}
				<div className="relative mb-4 h-64 w-full overflow-hidden rounded-xl">
					<Image
						src={images[selectedImage]?.url ?? ''}
						alt={`${projectTitle} preview`}
						fill
						className="object-cover"
						priority
					/>
				</div>

				{/* Thumbnail Gallery */}
				<div className="grid grid-cols-4 gap-3">
					{images.map((image, index) => (
						<button
							key={`thumbnail-${image.url.slice(-20)}-${index}`}
							type="button"
							onClick={() => setSelectedImage(index)}
							className={`overflow-hidden rounded-lg border-2 transition-all ${
								selectedImage === index
									? 'border-blue-500 ring-2 ring-blue-200'
									: 'border-gray-200 hover:border-blue-300'
							}`}
						>
							<Image
								src={image.url}
								alt={`${projectTitle} preview ${index + 1}`}
								className="h-16 w-full object-cover"
								priority
							/>
						</button>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
