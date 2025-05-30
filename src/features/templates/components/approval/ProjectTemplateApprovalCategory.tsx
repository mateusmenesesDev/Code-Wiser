import type { Category } from '@prisma/client';
import { Label } from '~/common/components/ui/label';
import { Switch } from '~/common/components/ui/switch';
import { useApproval } from '../../hook/useApproval';

type ProjectTemplateApprovalCategoryProps = {
	category: Category;
};

export function ProjectTemplateApprovalCategory({
	category
}: ProjectTemplateApprovalCategoryProps) {
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
