export function payloadBytes(value: unknown): number {
	return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

export function measureSync<T>(fn: () => T): { result: T; durationMs: number } {
	const start = performance.now();
	const result = fn();
	return { result, durationMs: performance.now() - start };
}

export async function measureAsync<T>(
	fn: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
	const start = performance.now();
	const result = await fn();
	return { result, durationMs: performance.now() - start };
}

export function percentile(samples: number[], p: number): number {
	if (samples.length === 0) return 0;
	const sorted = [...samples].sort((a, b) => a - b);
	const index = Math.min(
		sorted.length - 1,
		Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
	);
	return sorted[index] ?? 0;
}

export type SampleSummary = {
	count: number;
	minMs: number;
	maxMs: number;
	meanMs: number;
	p50Ms: number;
	p95Ms: number;
};

export function summarizeSamples(samples: number[]): SampleSummary {
	if (samples.length === 0) {
		return {
			count: 0,
			minMs: 0,
			maxMs: 0,
			meanMs: 0,
			p50Ms: 0,
			p95Ms: 0
		};
	}

	const sum = samples.reduce((acc, value) => acc + value, 0);
	return {
		count: samples.length,
		minMs: Math.min(...samples),
		maxMs: Math.max(...samples),
		meanMs: sum / samples.length,
		p50Ms: percentile(samples, 50),
		p95Ms: percentile(samples, 95)
	};
}
