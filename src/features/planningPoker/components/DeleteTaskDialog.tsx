'use client';

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

interface DeleteTaskDialogProps {
	open: boolean;
	taskTitle: string;
	isDeleting: boolean;
	onConfirm: () => Promise<void>;
	onOpenChange: (open: boolean) => void;
}

export function DeleteTaskDialog({
	open,
	taskTitle,
	isDeleting,
	onConfirm,
	onOpenChange
}: DeleteTaskDialogProps) {
	const handleConfirm = async () => {
		try {
			await onConfirm();
			onOpenChange(false);
		} catch {
			return;
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!isDeleting) onOpenChange(nextOpen);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete User Story</DialogTitle>
					<DialogDescription>
						Are you sure you want to permanently delete &quot;{taskTitle}&quot;?
						All votes for this story will be discarded. If this is the last story,
						the session will end.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleConfirm}
						disabled={isDeleting}
					>
						{isDeleting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Deleting...
							</>
						) : (
							'Delete User Story'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
