import { describe, expect, it } from 'vitest';
import {
	measureSync,
	payloadBytes,
	percentile,
	summarizeSamples
} from './measure';

describe('measure', () => {
	it('serializes payload size in bytes', () => {
		expect(payloadBytes({ a: 1 })).toBeGreaterThan(0);
		expect(payloadBytes({ a: 'x'.repeat(1000) })).toBeGreaterThan(
			payloadBytes({ a: 'x' })
		);
	});

	it('measures sync fn duration and returns result', () => {
		const { result, durationMs } = measureSync(() => 42);
		expect(result).toBe(42);
		expect(durationMs).toBeGreaterThanOrEqual(0);
	});

	it('computes percentile and summary stats', () => {
		const samples = [10, 20, 30, 40, 50];
		expect(percentile(samples, 50)).toBe(30);
		expect(summarizeSamples(samples)).toMatchObject({
			count: 5,
			minMs: 10,
			maxMs: 50,
			p50Ms: 30
		});
	});
});
