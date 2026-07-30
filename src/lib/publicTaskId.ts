const FALLBACK_PUBLIC_CODE = 'PROJECT';
const MAX_PUBLIC_CODE_LENGTH = 12;

export function generatePublicCode(title: string): string {
	const code = title
		.normalize('NFKD')
		.replace(/\p{Diacritic}/gu, '')
		.toUpperCase()
		.replace(/[^A-Z0-9]+/g, '')
		.slice(0, MAX_PUBLIC_CODE_LENGTH);

	return code || FALLBACK_PUBLIC_CODE;
}

export function formatPublicTaskId(
	publicCode: string | null | undefined,
	publicNumber: number | null | undefined
): string | null {
	if (!publicCode || publicNumber == null) return null;
	return `${publicCode}-${publicNumber}`;
}
