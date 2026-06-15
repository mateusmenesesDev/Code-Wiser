type CheckoutSessionForReturn = {
	status: string | null;
	payment_status: string;
	customer_details?: { email?: string | null } | null;
};

export type CheckoutReturnState =
	| { kind: 'missing_session' }
	| { kind: 'complete'; customerEmail?: string }
	| { kind: 'recoverable' }
	| { kind: 'unknown' }
	| { kind: 'error' };

export function getCheckoutReturnState(
	session: CheckoutSessionForReturn | null,
	error?: unknown
): CheckoutReturnState {
	if (error) return { kind: 'error' };
	if (!session) return { kind: 'missing_session' };

	if (session.status === 'complete') {
		return {
			kind: 'complete',
			customerEmail: session.customer_details?.email ?? undefined
		};
	}

	if (session.status === 'open') {
		return { kind: 'recoverable' };
	}

	return { kind: 'unknown' };
}
