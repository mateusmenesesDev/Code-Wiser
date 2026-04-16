import { useState } from 'react';
import { Button } from './ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from './ui/dialog';

interface ConfirmationDialogProps {
	title: string;
	description: string;
	children?: React.ReactNode;
	onConfirm: () => void;
	onCancel?: () => void;
	confirmLabel?: string;
	cancelLabel?: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export default function ConfirmationDialog({
	title,
	description,
	children,
	onConfirm,
	onCancel,
	confirmLabel = 'Confirm',
	cancelLabel = 'Cancel',
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange
}: ConfirmationDialogProps) {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

	const isControlled = controlledOpen !== undefined;
	const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
	const setIsOpen = isControlled
		? (open: boolean) => controlledOnOpenChange?.(open)
		: setUncontrolledOpen;

	const handleClick = (confirm: boolean) => {
		if (confirm) {
			onConfirm();
		} else {
			onCancel?.();
		}
		setIsOpen(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			{children && <DialogTrigger asChild>{children}</DialogTrigger>}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => handleClick(false)}>
						{cancelLabel}
					</Button>
					<Button variant="destructive" onClick={() => handleClick(true)}>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
