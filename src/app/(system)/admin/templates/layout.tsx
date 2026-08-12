import { requireAdminPermission } from '~/server/auth/requireAdminPermission';

export default function TemplatesAdminLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	requireAdminPermission('org:project:edit_template');
	return children;
}
