import { Plus, Tag, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';

interface TagsInputProps {
	value: string[];
	onChange: (tags: string[]) => void;
}

export function TagsInput({ value, onChange }: TagsInputProps) {
	const [newTag, setNewTag] = useState('');

	const handleAddTag = () => {
		if (newTag.trim() && !value.includes(newTag.trim())) {
			onChange([...value, newTag.trim()]);
			setNewTag('');
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		onChange(value.filter((tag) => tag !== tagToRemove));
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleAddTag();
		}
	};

	return (
		<div className="space-y-2">
			<Label className="flex items-center gap-1">Labels</Label>
			<div className="flex gap-2">
				<Input
					placeholder="Add tag"
					value={newTag}
					onChange={(e) => setNewTag(e.target.value)}
					onKeyDown={handleKeyDown}
				/>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleAddTag}
				>
					<Plus className="h-4 w-4" />
				</Button>
			</div>
			{value.length > 0 && (
				<div className="mt-2 flex flex-wrap gap-1">
					{value.map((tag) => (
						<Badge
							key={tag}
							variant="secondary"
							className="flex items-center gap-1"
						>
							<Tag className="h-3 w-3" />
							{tag}
							<button
								type="button"
								onClick={() => handleRemoveTag(tag)}
								className="hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
				</div>
			)}
		</div>
	);
}
