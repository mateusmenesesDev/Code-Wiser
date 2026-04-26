/**
 * Cal.com expects `Authorization: Bearer <token>` where `<token>` is the
 * raw key (e.g. `cal_live_...`). Some secrets are stored already prefixed
 * with `Bearer `, which would double-prefix if concatenated naively.
 */
export function calcomBearerAuthHeader(apiKey: string): string {
	const trimmed = apiKey.trim();
	const token = trimmed.replace(/^Bearer\s+/i, '');
	return `Bearer ${token}`;
}
