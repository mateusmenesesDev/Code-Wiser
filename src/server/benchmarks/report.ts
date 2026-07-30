import type { ClientBenchReport } from './clientBenches';
import type { SampleSummary } from './measure';
import type { StressScale } from './stressFixture';

export type ServerBenchReport = {
	available: boolean;
	reason?: string;
	catalog?: {
		latency: SampleSummary;
		payloadBytes: number;
		templateCount: number;
		taskCount: number;
	};
	myProjects?: {
		enrolledProjects: number;
		roundTrips: number;
		latency: SampleSummary;
	};
	adminActiveProjects?: {
		projectCount: number;
		leanPayloadBytes: number;
		heavyPayloadBytes: number;
		latency: SampleSummary;
	};
	reorderWrite?: {
		taskCount: number;
		serialStatements: number;
		bulkStatements: number;
		serialUpdate: SampleSummary;
		bulkUpdate: SampleSummary;
	};
	clone?: {
		sourceTaskCount: number;
		loadGraph: SampleSummary;
		loadPayloadBytes: number;
		inMemoryRemap: SampleSummary;
		bulkInsertClone: SampleSummary;
	};
};

export type BenchmarkReport = {
	phase: string;
	label: string;
	createdAt: string;
	scale: StressScale;
	client: ClientBenchReport;
	server: ServerBenchReport;
};

export function buildBenchmarkReport(input: {
	phase: string;
	label: string;
	scale: StressScale;
	client: ClientBenchReport;
	server: ServerBenchReport;
}): BenchmarkReport {
	return {
		phase: input.phase,
		label: input.label,
		createdAt: new Date().toISOString(),
		scale: input.scale,
		client: input.client,
		server: input.server
	};
}
