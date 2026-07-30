/**
 * Cal.com GET /v2/slots returns `data` as a date → slots map.
 */
export function extractSlotsByDate(
	payload: unknown
): Record<string, unknown[]> {
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
		return {};
	}
	const root = payload as { data?: unknown };
	const data = root.data;
	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		return {};
	}
	const obj = data as Record<string, unknown>;
	if (
		'slots' in obj &&
		obj.slots &&
		typeof obj.slots === 'object' &&
		!Array.isArray(obj.slots)
	) {
		return obj.slots as Record<string, unknown[]>;
	}
	return Object.fromEntries(
		Object.entries(obj).filter(([, v]) => Array.isArray(v))
	) as Record<string, unknown[]>;
}

export function slotEntryToIsoStart(entry: unknown): string | null {
	if (typeof entry === 'string') return entry;
	if (!entry || typeof entry !== 'object') return null;
	const o = entry as Record<string, unknown>;
	if (typeof o.start === 'string') return o.start;
	if (typeof o.time === 'string') return o.time;
	return null;
}
