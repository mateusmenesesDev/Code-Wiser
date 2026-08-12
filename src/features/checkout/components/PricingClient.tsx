'use client';

import { Sparkles } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { useUser } from '~/common/hooks/useUser';
import type { CheckoutInput } from '~/features/checkout/types/Checkout.type';

export function PricingClient() {
	const { userCredits } = useUser();

	return (
		<div className="mb-6 flex justify-center">
			<Badge variant="purple-gradient" className="px-4 py-2 text-lg">
				<Sparkles className="mr-2 h-4 w-4" />
				Current Balance: {userCredits} credits
			</Badge>
		</div>
	);
}

interface BuyCreditsButtonProps {
	creditId: string;
}

export function BuyCreditsButton({ creditId }: BuyCreditsButtonProps) {
	const checkoutRequestKey = useRef<string | null>(null);

	const handleClick = async () => {
		try {
			toast.info('Payment Processing');
			checkoutRequestKey.current ??= crypto.randomUUID();
			const response = await fetch('/api/checkout_sessions', {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					'idempotency-key': checkoutRequestKey.current
				},
				body: JSON.stringify({
					credit: creditId as CheckoutInput['credit'],
					mode: 'payment'
				})
			});

			if (!response.ok) {
				throw new Error('Failed to create checkout session');
			}

			const responseData = await response.json();
			window.location.href = responseData.url;
		} catch (error) {
			console.error(error);
			toast.error('Payment Failed');
		}
	};

	return (
		<Button onClick={handleClick} variant="primary">
			Buy Now
		</Button>
	);
}
