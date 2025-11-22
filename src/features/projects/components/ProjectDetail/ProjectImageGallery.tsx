'use client';

import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '~/common/components/ui/button';
import { Dialog, DialogContent } from '~/common/components/ui/dialog';

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
	const [isLightboxOpen, setIsLightboxOpen] = useState(false);

	const handleNext = useCallback(() => {
		setSelectedImage((prev) => (prev + 1) % images.length);
	}, [images.length]);

	const handlePrevious = useCallback(() => {
		setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
	}, [images.length]);

	// Handle keyboard navigation
	useEffect(() => {
		if (!isLightboxOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'ArrowLeft') {
				handlePrevious();
			} else if (e.key === 'ArrowRight') {
				handleNext();
			} else if (e.key === 'Escape') {
				setIsLightboxOpen(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isLightboxOpen, handleNext, handlePrevious]);

	if (images.length === 0) {
		return null;
	}

	const currentImage = images[selectedImage];

	return (
		<>
			{/* Main Gallery */}
			<div className="group relative w-full animate-fade-in overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-2xl transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]">
				{/* Main Image - Much larger and more prominent */}
				<button
					type="button"
					onClick={() => setIsLightboxOpen(true)}
					className="relative block w-full cursor-zoom-in overflow-hidden"
					aria-label="View full-size image"
				>
					<div className="relative aspect-video w-full overflow-hidden bg-gray-200">
						<Image
							src={currentImage?.url ?? ''}
							alt={
								currentImage?.alt
									? `${projectTitle} - ${currentImage.alt}`
									: `${projectTitle} project preview image`
							}
							fill
							className="object-contain transition-transform duration-500 group-hover:scale-105"
							priority
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
						/>
						{/* Overlay with zoom icon */}
						<div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/10">
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
								<ZoomIn className="h-6 w-6 text-gray-900" />
							</div>
						</div>
					</div>
				</button>

				{/* Navigation Arrows - Only show if more than 1 image */}
				{images.length > 1 && (
					<>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								handlePrevious();
							}}
							className="-translate-y-1/2 absolute top-1/2 left-4 rounded-full bg-white/90 p-2 opacity-0 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-white focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 group-hover:opacity-100"
							aria-label="Previous image"
						>
							<ChevronLeft className="h-6 w-6 text-gray-900" />
						</button>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								handleNext();
							}}
							className="-translate-y-1/2 absolute top-1/2 right-4 rounded-full bg-white/90 p-2 opacity-0 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-white focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 group-hover:opacity-100"
							aria-label="Next image"
						>
							<ChevronRight className="h-6 w-6 text-gray-900" />
						</button>
					</>
				)}

				{/* Image Counter */}
				{images.length > 1 && (
					<div className="-translate-x-1/2 absolute bottom-4 left-1/2 rounded-full bg-black/70 px-4 py-2 font-medium text-sm text-white backdrop-blur-sm">
						{selectedImage + 1} / {images.length}
					</div>
				)}
			</div>

			{/* Thumbnail Gallery */}
			{images.length > 1 && (
				<div className="mt-4 flex gap-4 overflow-x-auto px-2 pb-2">
					{images.map((image, index) => (
						<button
							key={`thumbnail-${image.url.slice(-20)}-${index}`}
							type="button"
							onClick={() => setSelectedImage(index)}
							className={`relative flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
								selectedImage === index
									? 'border-blue-500 shadow-lg ring-4 ring-blue-200 ring-offset-2'
									: 'border-gray-200 hover:border-blue-300'
							}`}
							aria-label={`View image ${index + 1}`}
						>
							<div className="relative h-20 w-32 sm:h-24 sm:w-36">
								<Image
									src={image.url}
									alt={
										image.alt
											? `${projectTitle} - ${image.alt} (thumbnail ${index + 1})`
											: `${projectTitle} project preview thumbnail ${index + 1}`
									}
									fill
									className="object-cover"
									sizes="144px"
								/>
							</div>
						</button>
					))}
				</div>
			)}

			{/* Lightbox Modal */}
			<Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
				<DialogContent className="max-w-7xl border-0 bg-transparent p-0 shadow-none data-[state=open]:bg-transparent">
					<div className="relative flex h-[90vh] w-full items-center justify-center">
						{/* Close Button */}
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setIsLightboxOpen(false)}
							className="absolute top-4 right-4 z-50 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
							aria-label="Close lightbox"
						>
							<X className="h-6 w-6" />
						</Button>

						{/* Main Lightbox Image */}
						<div className="relative h-full w-full">
							<Image
								src={currentImage?.url ?? ''}
								alt={
									currentImage?.alt
										? `${projectTitle} - ${currentImage.alt}`
										: `${projectTitle} project preview image`
								}
								fill
								className="object-contain"
								priority
								sizes="100vw"
							/>
						</div>

						{/* Navigation in Lightbox */}
						{images.length > 1 && (
							<>
								<Button
									variant="ghost"
									size="icon"
									onClick={handlePrevious}
									className="-translate-y-1/2 absolute top-1/2 left-4 rounded-full bg-white/10 p-4 text-white backdrop-blur-sm hover:scale-110 hover:bg-white/20"
									aria-label="Previous image"
								>
									<ChevronLeft className="h-8 w-8" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onClick={handleNext}
									className="-translate-y-1/2 absolute top-1/2 right-4 rounded-full bg-white/10 p-4 text-white backdrop-blur-sm hover:scale-110 hover:bg-white/20"
									aria-label="Next image"
								>
									<ChevronRight className="h-8 w-8" />
								</Button>

								{/* Image Counter in Lightbox */}
								<div className="-translate-x-1/2 absolute bottom-4 left-1/2 rounded-full bg-black/70 px-6 py-2 font-medium text-base text-white backdrop-blur-sm">
									{selectedImage + 1} / {images.length}
								</div>
							</>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
