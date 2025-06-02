'use client';

import { Plus, X } from 'lucide-react';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';

interface TaskTagsInputProps {
	initialTags?: string[];
}

export interface TaskTagsInputRef {
	getTags: () => string[];
	setTags: (tags: string[]) => void;
}

export const TaskTagsInput = forwardRef<TaskTagsInputRef, TaskTagsInputProps>(
	({ initialTags = [] }, ref) => {
		const [tags, setTags] = useState<string[]>(initialTags);
		const [newTag, setNewTag] = useState('');

		useImperativeHandle(ref, () => ({
			getTags: () => tags,
			setTags: (newTags: string[]) => setTags(newTags)
		}));

		const handleAddTag = () => {
			if (newTag.trim() && !tags.includes(newTag.trim())) {
				setTags([...tags, newTag.trim()]);
				setNewTag('');
			}
		};

		const handleRemoveTag = (tagToRemove: string) => {
			setTags(tags.filter((tag) => tag !== tagToRemove));
		};

		const handleKeyDown = (e: React.KeyboardEvent) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				handleAddTag();
			}
		};

		return (
			<div className="space-y-2">
				<Label>Tags</Label>
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
				{tags.length > 0 && (
					<div className="mt-2 flex flex-wrap gap-1">
						{tags.map((tag) => (
							<Badge
								key={tag}
								variant="secondary"
								className="flex items-center gap-1"
							>
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
);

TaskTagsInput.displayName = 'TaskTagsInput';
