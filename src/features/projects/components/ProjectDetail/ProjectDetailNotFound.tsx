import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '~/common/components/ui/button';

export default function ProjectDetailNotFound() {
	const router = useRouter();

	const handleGoBack = () => {
		router.back();
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<Button variant="ghost" className="mb-6" onClick={handleGoBack}>
				<ArrowLeft className="mr-2 h-4 w-4" />
				Back to Projects
			</Button>
			<div className="py-16 text-center">
				<h1 className="mb-4 font-bold text-2xl">Project Not Found</h1>
				<div className="text-muted-foreground">
					The project you're looking for doesn't exist or is not available.
				</div>
			</div>
		</div>
	);
}
