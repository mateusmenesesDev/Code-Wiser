import { atom } from 'jotai';

export interface PlanningPokerDialogState {
	isEndSessionDialogOpen: boolean;
	isFinalizeLastTaskDialogOpen: boolean;
}

export const planningPokerDialogAtom = atom<PlanningPokerDialogState>({
	isEndSessionDialogOpen: false,
	isFinalizeLastTaskDialogOpen: false
});
