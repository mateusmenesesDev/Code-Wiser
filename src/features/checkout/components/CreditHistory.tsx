'use client';

import { RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	Alert,
	AlertDescription,
	AlertTitle
} from '~/common/components/ui/alert';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';
import { api } from '~/trpc/react';

const transactionLabels: Record<string, string> = {
	PURCHASE: 'Credit purchase',
	CONSUMPTION: 'Credit use',
	REFUND: 'Refund',
	ADJUSTMENT: 'Adjustment'
};

const checkoutLabels: Record<string, string> = {
	OPEN: 'Checkout open',
	PROCESSING: 'Payment processing',
	PAID: 'Payment received',
	FULFILLED: 'Credits added',
	FAILED: 'Payment failed',
	EXPIRED: 'Checkout expired'
};

export function CreditHistory() {
	const utils = api.useUtils();
	const [refreshingSessionId, setRefreshingSessionId] = useState<string | null>(
		null
	);
	const transactions = api.user.getCreditTransactions.useQuery({
		skip: 0,
		take: 25
	});
	const checkouts = api.user.getCreditCheckouts.useQuery({ take: 10 });
	const refreshCheckout = api.user.refreshCreditCheckout.useMutation({
		onSuccess: async () => {
			await Promise.all([
				utils.user.getCreditCheckouts.invalidate(),
				utils.user.getCreditTransactions.invalidate(),
				utils.user.getCredits.invalidate()
			]);
			toast.success('Checkout status refreshed');
		},
		onError: (error) => toast.error(error.message)
	});

	const handleRefresh = async (sessionId: string) => {
		setRefreshingSessionId(sessionId);
		try {
			await refreshCheckout.mutateAsync({ sessionId });
		} finally {
			setRefreshingSessionId(null);
		}
	};

	return (
		<div className="mt-10 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle level={2}>Recent checkout attempts</CardTitle>
					<CardDescription>
						Resume an open checkout or refresh a payment that is still being
						confirmed.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{checkouts.isLoading ? (
						<p className="text-muted-foreground">Loading checkout status...</p>
					) : checkouts.data?.length ? (
						<div className="space-y-3">
							{checkouts.data.map((checkout) => (
								<div
									key={checkout.id}
									className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
								>
									<div>
										<div className="flex flex-wrap items-center gap-2">
											<Badge
												variant={
													checkout.status === 'FULFILLED'
														? 'success'
														: 'secondary'
												}
											>
												{checkoutLabels[checkout.status] ?? checkout.status}
											</Badge>
											<span className="font-medium">
												{checkout.credits} credits
											</span>
										</div>
										<p className="mt-1 text-muted-foreground text-sm">
											{new Date(checkout.createdAt).toLocaleString()}
										</p>
										{checkout.failureReason ? (
											<p className="mt-1 text-destructive text-sm">
												{checkout.failureReason}
											</p>
										) : null}
									</div>
									<div className="flex gap-2">
										{checkout.status === 'OPEN' && checkout.checkoutUrl ? (
											<a href={checkout.checkoutUrl}>
												<Button variant="primary">Resume checkout</Button>
											</a>
										) : null}
										{checkout.status !== 'FULFILLED' &&
										checkout.status !== 'EXPIRED' ? (
											<Button
												variant="outline"
												disabled={
													refreshingSessionId === checkout.stripeSessionId
												}
												onClick={() => handleRefresh(checkout.stripeSessionId)}
											>
												<RefreshCcw className="mr-2 h-4 w-4" />
												{refreshingSessionId === checkout.stripeSessionId
													? 'Checking...'
													: 'Refresh status'}
											</Button>
										) : null}
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-muted-foreground">No checkout attempts yet.</p>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle level={2}>Credit history</CardTitle>
					<CardDescription>
						Purchases, usage, refunds, and adjustments are recorded in the
						credit ledger.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{transactions.isError ? (
						<Alert variant="destructive">
							<AlertTitle>Could not load credit history</AlertTitle>
							<AlertDescription>
								Refresh the page to try again.
							</AlertDescription>
						</Alert>
					) : transactions.isLoading ? (
						<p className="text-muted-foreground">Loading credit history...</p>
					) : transactions.data?.transactions.length ? (
						<>
							<div className="mb-4 flex flex-wrap gap-4 text-sm">
								<span>
									Current balance:{' '}
									<strong>{transactions.data.storedBalance}</strong>
								</span>
								<span>
									Ledger balance:{' '}
									<strong>{transactions.data.ledgerBalance}</strong>
								</span>
								{transactions.data.difference !== 0 ? (
									<span className="text-destructive">
										Reconciliation difference: {transactions.data.difference}
									</span>
								) : null}
							</div>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Date</TableHead>
										<TableHead>Event</TableHead>
										<TableHead>Note</TableHead>
										<TableHead className="text-right">Credits</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{transactions.data.transactions.map((transaction) => (
										<TableRow key={transaction.id}>
											<TableCell>
												{new Date(transaction.createdAt).toLocaleString()}
											</TableCell>
											<TableCell>
												{transactionLabels[transaction.type] ??
													transaction.type}
											</TableCell>
											<TableCell className="max-w-xs truncate text-muted-foreground">
												{transaction.note ?? transaction.source}
											</TableCell>
											<TableCell
												className={`text-right font-medium ${transaction.value < 0 ? 'text-destructive' : 'text-success'}`}
											>
												{transaction.value > 0 ? '+' : ''}
												{transaction.value}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							{transactions.data.total >
							transactions.data.transactions.length ? (
								<p className="mt-4 text-muted-foreground text-sm">
									Showing the latest {transactions.data.transactions.length} of{' '}
									{transactions.data.total} entries.
								</p>
							) : null}
						</>
					) : (
						<p className="text-muted-foreground">No credit activity yet.</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
