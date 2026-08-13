import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import {
	exchangeGitHubCode,
	GitHubServiceError,
	verifyGitHubInstallState,
	verifyGitHubUserInstallation
} from '~/server/services/github/github';

function redirect(
	request: Request,
	returnTo: string,
	result: string
): NextResponse {
	const url = new URL(returnTo, request.url);
	url.searchParams.set('github', result);
	return NextResponse.redirect(url);
}

export async function GET(request: Request) {
	const searchParams = new URL(request.url).searchParams;
	const state = searchParams.get('state');
	const code = searchParams.get('code');
	const installationId = searchParams.get('installation_id');
	let returnTo = '/';

	try {
		if (!state || !code || !installationId) {
			throw new GitHubServiceError('GitHub authorization is incomplete');
		}
		const stateData = verifyGitHubInstallState(state);
		returnTo = stateData.returnTo;
		const { userId } = await auth();
		if (!userId || userId !== stateData.userId) {
			throw new GitHubServiceError(
				'GitHub authorization belongs to another user'
			);
		}

		const userToken = await exchangeGitHubCode(code);
		const installation = await verifyGitHubUserInstallation(
			userToken,
			installationId
		);
		const existing = await db.gitHubInstallation.findUnique({
			where: { githubInstallationId: installation.id },
			select: { userId: true }
		});
		if (existing && existing.userId !== userId) {
			throw new GitHubServiceError(
				'This GitHub installation is already connected to another account'
			);
		}

		await db.gitHubInstallation.upsert({
			where: { githubInstallationId: installation.id },
			create: {
				githubInstallationId: installation.id,
				accountLogin: installation.accountLogin,
				accountType: installation.accountType,
				userId
			},
			update: {
				accountLogin: installation.accountLogin,
				accountType: installation.accountType,
				active: true,
				userId
			}
		});

		return redirect(request, returnTo, 'connected');
	} catch (error) {
		if (!(error instanceof GitHubServiceError)) {
			console.error('Failed to complete GitHub installation:', error);
		}
		return redirect(request, returnTo, 'error');
	}
}
