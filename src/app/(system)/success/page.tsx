import { CheckCircle2, HelpCircle, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { env } from '~/env';
import { getCheckoutReturnState } from '~/features/checkout/utils/checkoutReturn';
import { stripe } from '~/services/stripe';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Checkout status | CodeWise',
	description: 'Review the status of your CodeWise checkout.'
};

type SuccessPageProps = {
	searchParams?: { session_id?: string | string[] };
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
	const sessionId = Array.isArray(searchParams?.session_id)
		? searchParams?.session_id[0]
		: searchParams?.session_id;

	const state = await getReturnState(sessionId);
	const supportEmail = env.SUPPORT_EMAIL;

	if (state.kind === 'complete') {
		return (
			<div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-12">
				<Card className="w-full max-w-xl border-success/30 shadow-lg">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-muted">
							<CheckCircle2 className="h-7 w-7 text-success" />
						</div>
						<CardTitle level={1} className="text-3xl">
							Checkout complete
						</CardTitle>
						<CardDescription className="text-base">
							Thanks for your purchase. Stripe accepted your checkout, and your
							credits are granted by our secure payment webhook, so they may
							take a moment to appear.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6 text-center">
						{state.customerEmail ? (
							<p className="text-muted-foreground">
								Stripe will send the receipt to {state.customerEmail}.
							</p>
						) : null}
						<div className="flex flex-col justify-center gap-3 sm:flex-row">
							<Button asChild variant="primary">
								<Link href="/my-projects">Go to dashboard</Link>
							</Button>
							<Button asChild variant="outline">
								<Link href="/pricing">View pricing</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (state.kind === 'recoverable') {
		return (
			<div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-12">
				<Card className="w-full max-w-xl border-info/30 shadow-lg">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-info-muted">
							<RefreshCcw className="h-7 w-7 text-info" />
						</div>
						<CardTitle level={1} className="text-3xl">
							Checkout still open
						</CardTitle>
						<CardDescription className="text-base">
							This checkout was not completed yet. You can retry from pricing or
							return to your dashboard.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col justify-center gap-3 sm:flex-row">
						<Button asChild variant="primary">
							<Link href="/pricing">Retry checkout</Link>
						</Button>
						<Button asChild variant="outline">
							<Link href="/my-projects">Go to dashboard</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-12">
			<Card className="w-full max-w-xl border-destructive/30 shadow-lg">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
						<HelpCircle className="h-7 w-7 text-destructive" />
					</div>
					<CardTitle level={1} className="text-3xl">
						We could not verify this checkout
					</CardTitle>
					<CardDescription className="text-base">
						{state.kind === 'missing_session'
							? 'The checkout session was missing from this link.'
							: 'Stripe did not return a completed checkout for this link.'}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6 text-center">
					<p className="text-muted-foreground">
						If you completed payment, do not pay again until we confirm your
						account state.
					</p>
					<div className="flex flex-col justify-center gap-3 sm:flex-row">
						{supportEmail ? (
							<Button asChild variant="primary">
								<a href={`mailto:${supportEmail}`}>Contact support</a>
							</Button>
						) : null}
						<Button asChild variant={supportEmail ? 'outline' : 'primary'}>
							<Link href="/pricing">Back to pricing</Link>
						</Button>
						<Button asChild variant="ghost">
							<Link href="/">Home</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

async function getReturnState(sessionId: string | undefined) {
	if (!sessionId) return getCheckoutReturnState(null);

	try {
		const session = await stripe.checkout.sessions.retrieve(sessionId);
		return getCheckoutReturnState(session);
	} catch (error) {
		return getCheckoutReturnState(null, error);
	}
}
