import type { Category } from '@prisma/client';
import { Label } from '~/common/components/label';
import { Switch } from '~/common/components/switch';
import { useApproval } from '../../hooks/useApproval';

type ProjectApprovalCategoryProps = {
	category: Category;
};

export function ProjectApprovalCategory({
	category
}: ProjectApprovalCategoryProps) {
	const { changeCategoryApprovalMutation } = useApproval();
	const { mutate: changeCategoryApproval, isPending } =
		changeCategoryApprovalMutation;

	const handleApproveCategory = () => {
		changeCategoryApproval({
			categoryName: category.name,
			approval: !category.approved
		});
	};

	return (
		<div className="flex items-center justify-between">
			<span>{category.name}</span>
			<div className="flex items-center space-x-2">
				<Switch
					id={`approve-category-${category.id}`}
					onCheckedChange={handleApproveCategory}
					checked={category.approved}
					disabled={isPending}
				/>
				<Label htmlFor={`approve-category-${category.id}`}>Approve</Label>
			</div>
		</div>
	);
}
