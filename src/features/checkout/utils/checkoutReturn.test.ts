import { describe, expect, it } from 'vitest';
import { getCheckoutReturnState } from './checkoutReturn';

describe('getCheckoutReturnState', () => {
	it('does not require a session id', () => {
		expect(getCheckoutReturnState(null)).toEqual({ kind: 'missing_session' });
	});

	it('treats complete sessions as async-safe confirmations', () => {
		expect(
			getCheckoutReturnState({
				status: 'complete',
				payment_status: 'paid',
				customer_details: { email: 'buyer@example.com' }
			})
		).toEqual({ kind: 'complete', customerEmail: 'buyer@example.com' });
	});

	it('sends open sessions to recovery', () => {
		expect(
			getCheckoutReturnState({
				status: 'open',
				payment_status: 'unpaid',
				customer_details: null
			})
		).toEqual({ kind: 'recoverable' });
	});

	it('treats expired sessions as unknown verification states', () => {
		expect(
			getCheckoutReturnState({
				status: 'expired',
				payment_status: 'unpaid',
				customer_details: null
			})
		).toEqual({ kind: 'unknown' });
	});

	it('hides Stripe errors behind a generic verification failure', () => {
		expect(
			getCheckoutReturnState(null, new Error('No such checkout.session'))
		).toEqual({ kind: 'error' });
	});
});
