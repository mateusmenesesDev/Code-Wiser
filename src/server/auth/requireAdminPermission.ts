import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export function requireAdminAccess() {
	const session = auth();
	const adminPermissions: ClerkAuthorization['permission'][] = [
		'org:project:create',
		'org:project:update',
		'org:project:edit_template'
	];
	const hasAdminPermission = adminPermissions.some((permission) =>
		session.has({ permission })
	);

	if (!hasAdminPermission) {
		redirect('/');
	}
}

export function requireAdminPermission(
	permission: ClerkAuthorization['permission']
) {
	const session = auth();

	if (!session.has({ permission })) {
		redirect('/');
	}
}
