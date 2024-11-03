import type { Category } from '@prisma/client';
import { Label } from '~/common/components/label';
import { Switch } from '~/common/components/switch';
import { useApproval } from '../../hooks/useApproval';

type ProjectApprovalCategoryProps = {
	category: Category;
	approved: boolean;
};

export function ProjectApprovalCategory({
	category,
	approved
}: ProjectApprovalCategoryProps) {
	const { changeCategoryApprovalMutation } = useApproval();

	const handleApproveCategory = () => {
		changeCategoryApprovalMutation.mutate({
			categoryName: category.name,
			approval: !approved
		});
	};

	return (
		<div className="flex items-center justify-between">
			<span>{category.name}</span>
			<div className="flex items-center space-x-2">
				<Switch
					id={`approve-category-${category.id}`}
					onCheckedChange={handleApproveCategory}
				/>
				<Label htmlFor={`approve-category-${category.id}`}>Approve</Label>
			</div>
		</div>
	);
}
