'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '~/common/components/ui/button';

type GoBackButtonProps = {
	children: React.ReactNode;
};

export default function GoBackButton({ children }: GoBackButtonProps) {
	const router = useRouter();

	const handleGoBack = () => {
		router.back();
	};

	return (
		<Button variant="ghost" className="mb-6" onClick={handleGoBack}>
			<ArrowLeft className="mr-2 h-4 w-4" />
			{children}
		</Button>
	);
}
