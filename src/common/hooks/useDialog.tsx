import { useAtom } from 'jotai';
import { isDialogOpenAtom } from '../atoms/dialog.atom';

export function useDialog() {
	const [isDialogOpen, setIsDialogOpen] = useAtom(isDialogOpenAtom);

	return {
		isDialogOpen,
		setIsDialogOpen
	};
}
