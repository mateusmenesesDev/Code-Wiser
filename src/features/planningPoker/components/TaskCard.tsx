import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '~/common/components/ui/button';
import { Textarea } from '~/common/components/ui/textarea';

interface TaskCardProps {
	task: {
		id: string;
		publicTaskId?: string | null;
		title: string;
		description: string | null;
	};
	canEdit?: boolean;
	onSaveDescription?: (description: string) => Promise<void>;
	isSavingDescription?: boolean;
}

export function TaskCard({
	task,
	canEdit = false,
	onSaveDescription,
	isSavingDescription = false
}: TaskCardProps) {
	const plainDescription = task.description
		? task.description
				.replace(/<br\s*\/?>/gi, '\n')
				.replace(/<\/p>/gi, '\n')
				.replace(/<[^>]*>/g, '')
				.trim()
		: null;
	const [isEditing, setIsEditing] = useState(false);
	const [draftDescription, setDraftDescription] = useState(
		plainDescription ?? ''
	);

	useEffect(() => {
		if (!isEditing) {
			setDraftDescription(plainDescription ?? '');
		}
	}, [isEditing, plainDescription]);

	const hasChanges = draftDescription.trim() !== (plainDescription ?? '');

	const handleSave = async () => {
		if (!onSaveDescription || !hasChanges || isSavingDescription) return;

		try {
			await onSaveDescription(draftDescription);
			setIsEditing(false);
		} catch {
			return;
		}
	};

	return (
		<div className="rounded-lg border bg-card p-6 shadow-sm">
			{task.publicTaskId && (
				<div className="mb-2 font-mono text-muted-foreground text-sm">
					{task.publicTaskId}
				</div>
			)}
			<div className="flex items-start justify-between gap-4">
				<h2 className="font-semibold text-xl">{task.title}</h2>
				{canEdit && !isEditing && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsEditing(true)}
						aria-label="Edit task description"
					>
						<Pencil className="mr-2 h-4 w-4" />
						Edit description
					</Button>
				)}
			</div>

			{isEditing ? (
				<div className="mt-3 space-y-3">
					<Textarea
						aria-label="Task description"
						value={draftDescription}
						onChange={(event) => setDraftDescription(event.target.value)}
						disabled={isSavingDescription}
						rows={6}
						autoFocus
					/>
					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsEditing(false)}
							disabled={isSavingDescription}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={() => void handleSave()}
							disabled={!hasChanges || isSavingDescription}
						>
							{isSavingDescription ? 'Saving...' : 'Save description'}
						</Button>
					</div>
				</div>
			) : (
				plainDescription && (
					<div className="mt-2 whitespace-pre-wrap text-muted-foreground text-sm">
						{plainDescription}
					</div>
				)
			)}
		</div>
	);
}
