'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/common/components/ui/dialog';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import { api } from '~/trpc/react';

interface CloneTemplateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	templateId: string;
	templateTitle: string;
	onSuccess?: (clonedId: string) => void;
}

export function CloneTemplateDialog({
	open,
	onOpenChange,
	templateId,
	templateTitle,
	onSuccess
}: CloneTemplateDialogProps) {
	const router = useRouter();
	const [newTitle, setNewTitle] = useState('');
	const utils = api.useUtils();

	const cloneMutation = api.projectTemplate.clone.useMutation({
		onSuccess: (clonedId) => {
			toast.success('Template clonado com sucesso!');
			setNewTitle('');
			onOpenChange(false);
			utils.projectTemplate.getAll.invalidate();
			onSuccess?.(clonedId);
			router.push(`/admin/templates/${clonedId}/edit`);
		},
		onError: (error) => {
			toast.error(error.message || 'Erro ao clonar template');
		}
	});

	const handleClone = () => {
		if (!newTitle.trim()) {
			toast.error('O título é obrigatório');
			return;
		}

		cloneMutation.mutate({
			id: templateId,
			newTitle: newTitle.trim()
		});
	};

	const handleOpenChange = (isOpen: boolean) => {
		if (isOpen) {
			setNewTitle(`${templateTitle} (Copy)`);
		} else {
			setNewTitle('');
		}
		onOpenChange(isOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Clonar Template</DialogTitle>
					<DialogDescription>
						Digite um novo título para o template clonado. Todos os dados
						(sprints, epics, tasks, tecnologias, etc.) serão copiados.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="title">Título do Template</Label>
						<Input
							id="title"
							value={newTitle}
							onChange={(e) => setNewTitle(e.target.value)}
							placeholder="Digite o título do novo template"
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleClone();
								}
							}}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={cloneMutation.isPending}
					>
						Cancelar
					</Button>
					<Button
						onClick={handleClone}
						disabled={cloneMutation.isPending || !newTitle.trim()}
					>
						{cloneMutation.isPending ? 'Clonando...' : 'Clonar'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
