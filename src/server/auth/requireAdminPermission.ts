import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

type OrganizationData = {
	rol?: string;
};

export function requireAdminAccess() {
	const session = auth();
	const isLegacyAdmin =
		(session.sessionClaims?.o as OrganizationData | undefined)?.rol === 'admin';
	const adminPermissions: ClerkAuthorization['permission'][] = [
		'org:project:create',
		'org:project:update',
		'org:project:edit_template'
	];
	const hasAdminAccess =
		isLegacyAdmin ||
		session.has({ role: 'org:admin' }) ||
		adminPermissions.some((permission) => session.has({ permission }));

	if (!hasAdminAccess) {
		redirect('/');
	}
}

export function requireAdminPermission(
	permission: ClerkAuthorization['permission']
) {
	const session = auth();
	const isLegacyAdmin =
		(session.sessionClaims?.o as OrganizationData | undefined)?.rol === 'admin';

	if (
		!isLegacyAdmin &&
		!session.has({ role: 'org:admin' }) &&
		!session.has({ permission })
	) {
		redirect('/');
	}
}
