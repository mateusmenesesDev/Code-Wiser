import { requireAdminPermission } from '~/server/auth/requireAdminPermission';

export default function ExercisesAdminLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	requireAdminPermission('org:project:create');
	return children;
}
