import { useRouter } from 'next/navigation';
import { Button } from '~/common/components/ui/button';

export default function InsufficientCreditsError() {
	const router = useRouter();
	return (
		<div className="flex flex-col gap-2">
			<p>You do not have enough credits to create this project</p>
			<div className="flex gap-2">
				<Button
					size="sm"
					variant="secondary"
					onClick={() => router.push('/pricing')}
				>
					Upgrade Plan
				</Button>
				<Button size="sm" onClick={() => router.push('/pricing')}>
					Buy Credits
				</Button>
			</div>
		</div>
	);
}
