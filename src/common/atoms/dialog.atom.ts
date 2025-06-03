import { atom } from 'jotai';

export type DialogType =
	| 'task'
	| 'sprint'
	| 'epic'
	| 'project'
	| 'user'
	| 'signIn'
	| 'signUp';

export interface DialogState {
	isOpen: boolean;
	type?: DialogType;
}

export const dialogAtom = atom<DialogState>({
	isOpen: false,
	type: undefined
});
