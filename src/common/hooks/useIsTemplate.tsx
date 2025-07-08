import { usePathname } from 'next/navigation';

export const useIsTemplate = () => {
	const pathname = usePathname();

	return pathname.startsWith('/admin/templates');
};
