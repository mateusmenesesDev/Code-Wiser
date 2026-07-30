import { ArrowLeft, Home } from 'lucide-react';
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

export const metadata: Metadata = {
	title: 'Checkout canceled | CodeWise',
	description: 'Your checkout was canceled. You were not charged.'
};

export default function CanceledPage() {
	return (
		<div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-12">
			<Card className="w-full max-w-xl border-info/30 shadow-lg">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-info-muted">
						<ArrowLeft className="h-7 w-7 text-info" />
					</div>
					<CardTitle level={1} className="text-3xl">
						Checkout canceled
					</CardTitle>
					<CardDescription className="text-base">
						No worries — your checkout was not completed and you were not
						charged.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6 text-center">
					<p className="text-muted-foreground">
						You can review the plans again whenever you are ready, or return to
						CodeWise and keep exploring.
					</p>
					<div className="flex flex-col justify-center gap-3 sm:flex-row">
						<Button asChild variant="primary">
							<Link href="/pricing">Back to pricing</Link>
						</Button>
						<Button asChild variant="outline">
							<Link href="/my-projects">Go to dashboard</Link>
						</Button>
						<Button asChild variant="ghost">
							<Link href="/">
								<Home className="mr-2 h-4 w-4" />
								Home
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
