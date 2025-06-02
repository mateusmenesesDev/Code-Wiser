import { useAtom } from 'jotai';
import { type DialogType, dialogAtom } from '../atoms/dialog.atom';

export function useDialog() {
	const [dialogState, setDialogState] = useAtom(dialogAtom);

	const openDialog = (type: DialogType) => {
		setDialogState({
			isOpen: true,
			type
		});
	};

	const closeDialog = () => {
		setDialogState({
			isOpen: false,
			type: undefined
		});
	};

	const isDialogOpen = (type?: DialogType) => {
		if (!type) return dialogState.isOpen;
		return dialogState.isOpen && dialogState.type === type;
	};

	return {
		dialogState,
		openDialog,
		closeDialog,
		isDialogOpen,
		isOpen: dialogState.isOpen,
		dialogType: dialogState.type
	};
}
