'use client';

import { useEffect, useState } from 'react';
import { Button } from '~/common/components/ui/button';
import {
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Input } from '~/common/components/ui/input';
import { Textarea } from '~/common/components/ui/textarea';
import { api } from '~/trpc/react';

type ProductVersion = {
	id: string;
	name: string;
	description: string | null;
};

interface ProductVersionDialogProps {
	projectId: string;
	isTemplate: boolean;
	version: ProductVersion | null;
	onClose: () => void;
}

export default function ProductVersionDialog({
	projectId,
	isTemplate,
	version,
	onClose
}: ProductVersionDialogProps) {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const createVersion = api.productVersion.create.useMutation();
	const updateVersion = api.productVersion.update.useMutation();

	useEffect(() => {
		setName(version?.name ?? '');
		setDescription(version?.description ?? '');
	}, [version]);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!name.trim()) return;

		if (version) {
			await updateVersion.mutateAsync({
				id: version.id,
				name: name.trim(),
				description: description.trim() || undefined
			});
		} else {
			await createVersion.mutateAsync({
				projectId,
				isTemplate,
				name: name.trim(),
				description: description.trim() || undefined
			});
		}
		onClose();
	};

	const isPending = createVersion.isPending || updateVersion.isPending;

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>
					{version ? 'Edit product version' : 'New product version'}
				</DialogTitle>
			</DialogHeader>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<label htmlFor="product-version-name" className="font-medium text-sm">
						Name
					</label>
					<Input
						id="product-version-name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						placeholder="MVP, v0.1, v1..."
						maxLength={100}
						autoFocus
					/>
				</div>
				<div className="space-y-2">
					<label
						htmlFor="product-version-description"
						className="font-medium text-sm"
					>
						Description (optional)
					</label>
					<Textarea
						id="product-version-description"
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						placeholder="What is delivered in this version?"
						maxLength={1000}
					/>
				</div>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending || !name.trim()}>
						{isPending
							? 'Saving...'
							: version
								? 'Save version'
								: 'Create version'}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}
