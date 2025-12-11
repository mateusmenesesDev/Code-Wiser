export function getBaseUrl(): string {
	if (typeof window !== 'undefined') return window.location.origin;
	if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
	if (process.env.NODE_ENV === 'production') {
		return 'https://app.codewise.online';
	}
	return `http://localhost:${process.env.PORT ?? 3000}`;
}
