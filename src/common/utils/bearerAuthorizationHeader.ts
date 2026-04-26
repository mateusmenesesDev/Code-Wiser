/** Builds `Authorization: Bearer <token>` for APIs that expect a raw token. */
export function bearerAuthorizationHeader(credential: string): string {
	const trimmed = credential.trim();
	const token = trimmed.replace(/^Bearer\s+/i, '');
	return `Bearer ${token}`;
}
