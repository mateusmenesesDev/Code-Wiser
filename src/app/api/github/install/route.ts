import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
	createGitHubInstallState,
	githubAppInstallUrl,
	GitHubServiceError
} from '~/server/services/github/github';

function redirect(request: Request, path: string): NextResponse {
	return NextResponse.redirect(new URL(path, request.url));
}

function safeReturnTo(value: string | null): string {
	if (value?.startsWith('/workspace/')) return value;
	if (value?.startsWith('/admin/exercises/')) return value;
	return '/';
}

export async function GET(request: Request) {
	const { userId } = await auth();
	if (!userId) return redirect(request, '/?github=unauthorized');

	const returnTo = safeReturnTo(
		new URL(request.url).searchParams.get('returnTo')
	);
	try {
		const state = createGitHubInstallState(userId, returnTo);
		const installUrl = new URL(githubAppInstallUrl());
		installUrl.searchParams.set('state', state);
		return NextResponse.redirect(installUrl);
	} catch (error) {
		if (!(error instanceof GitHubServiceError)) {
			console.error('Failed to start GitHub installation:', error);
		}
		return redirect(request, `${returnTo}?github=not-configured`);
	}
}
