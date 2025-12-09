'use client';

import { useAtom } from 'jotai';
import { Loader2 } from 'lucide-react';
import { Button } from '~/common/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { planningPokerDialogAtom } from '../atoms/planningPokerDialog.atom';

interface FinalizeLastTaskDialogProps {
	onConfirm: () => void;
	isFinalizing: boolean;
	isEnding: boolean;
}

export function FinalizeLastTaskDialog({
	onConfirm,
	isFinalizing,
	isEnding
}: FinalizeLastTaskDialogProps) {
	const [dialogState, setDialogState] = useAtom(planningPokerDialogAtom);

	const handleClose = () => {
		setDialogState((prev) => ({
			...prev,
			isFinalizeLastTaskDialogOpen: false
		}));
	};

	const handleConfirm = () => {
		onConfirm();
		handleClose();
	};

	return (
		<Dialog
			open={dialogState.isFinalizeLastTaskDialogOpen}
			onOpenChange={(open) => {
				if (!open) {
					handleClose();
				}
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Finalize Last Task & End Session</DialogTitle>
					<DialogDescription>
						This is the last task. Finalizing it will save the story points and
						end the planning poker session. Are you sure you want to continue?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={handleClose}
						disabled={isFinalizing || isEnding}
					>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={handleConfirm}
						disabled={isFinalizing || isEnding}
					>
						{isFinalizing || isEnding ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Processing...
							</>
						) : (
							'Finalize & End Session'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
