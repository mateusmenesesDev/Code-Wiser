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

interface EndSessionDialogProps {
	onConfirm: () => void;
	isEnding: boolean;
}

export function EndSessionDialog({
	onConfirm,
	isEnding
}: EndSessionDialogProps) {
	const [dialogState, setDialogState] = useAtom(planningPokerDialogAtom);

	const handleClose = () => {
		setDialogState((prev) => ({
			...prev,
			isEndSessionDialogOpen: false
		}));
	};

	const handleConfirm = () => {
		onConfirm();
		handleClose();
	};

	return (
		<Dialog
			open={dialogState.isEndSessionDialogOpen}
			onOpenChange={(open) => {
				if (!open) {
					handleClose();
				}
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>End Planning Poker Session</DialogTitle>
					<DialogDescription>
						Are you sure you want to end this session? All progress will be
						saved and the session will be completed.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={handleClose} disabled={isEnding}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleConfirm}
						disabled={isEnding}
					>
						{isEnding ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Ending...
							</>
						) : (
							'End Session'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
