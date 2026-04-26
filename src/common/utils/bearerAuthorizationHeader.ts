/** Builds `Authorization: Bearer <token>` for APIs that expect a raw token. */
export function bearerAuthorizationHeader(credential: string): string {
	let token = credential.trim().replace(/^Bearer\s+/i, '');
	token = token.replaceAll('\r', '').replaceAll('\n', '');
	if (
		(token.startsWith('"') && token.endsWith('"')) ||
		(token.startsWith("'") && token.endsWith("'"))
	) {
		token = token.slice(1, -1).trim();
	}
	return `Bearer ${token}`;
}
