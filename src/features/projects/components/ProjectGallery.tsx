import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '~/common/components/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/card';

interface ProjectImage {
	id: number;
	src: string;
	alt: string;
}

interface ProjectGalleryProps {
	images: ProjectImage[];
}

export function ProjectGallery({ images }: ProjectGalleryProps) {
	const [currentImageIndex, setCurrentImageIndex] = useState(0);

	const nextImage = () => {
		setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
	};

	const prevImage = () => {
		setCurrentImageIndex(
			(prevIndex) => (prevIndex - 1 + images.length) % images.length
		);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Project Gallery</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="relative">
					<Image
						src={images[currentImageIndex]?.src || ''}
						alt={images[currentImageIndex]?.alt || ''}
						width={600}
						height={400}
						className="h-auto w-full rounded-lg"
					/>
					<Button
						variant="outline"
						size="icon"
						className="-translate-y-1/2 absolute top-1/2 left-2 transform"
						onClick={prevImage}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="-translate-y-1/2 absolute top-1/2 right-2 transform"
						onClick={nextImage}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
				<p className="mt-2 text-center text-muted-foreground">
					{images[currentImageIndex]?.alt || ''}
				</p>
				<div className="mt-4 flex justify-center space-x-2">
					{images.map((image, index) => (
						<Button
							key={image.src}
							variant={index === currentImageIndex ? 'default' : 'outline'}
							size="icon"
							className="h-2 w-2 rounded-full p-0"
							onClick={() => setCurrentImageIndex(index)}
						>
							<span className="sr-only">Go to image {index + 1}</span>
						</Button>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
