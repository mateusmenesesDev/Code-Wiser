import { useAtom } from 'jotai';
import { type DialogType, dialogAtom } from '../atoms/dialog.atom';

export function useDialog(dialogType: DialogType) {
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

	const isDialogOpen = dialogState.type === dialogType;

	return {
		dialogState,
		openDialog,
		closeDialog,
		isDialogOpen,
		isOpen: dialogState.isOpen,
		dialogType: dialogState.type
	};
}
