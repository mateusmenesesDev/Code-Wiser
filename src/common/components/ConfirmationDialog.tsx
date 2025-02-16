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
	children: React.ReactNode;
	onConfirm: () => void;
}

export default function ConfirmationDialog({
	title,
	description,
	children,
	onConfirm
}: ConfirmationDialogProps) {
	const [isOpen, setIsOpen] = useState(false);

	const handleClick = (confirm: boolean) => {
		if (confirm) {
			onConfirm();
		}
		setIsOpen(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => handleClick(false)}>
						Cancel
					</Button>
					<Button variant="destructive" onClick={() => handleClick(true)}>
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
