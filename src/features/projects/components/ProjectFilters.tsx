import { Search } from 'lucide-react';
import { Input } from '~/common/components/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/select';

interface ProjectFiltersProps {
	searchTerm: string;
	setSearchTerm: (value: string) => void;
	categoryFilter: string;
	setCategoryFilter: (value: string) => void;
	difficultyFilter: string;
	setDifficultyFilter: (value: string) => void;
	costFilter: string;
	setCostFilter: (value: string) => void;
}

export function ProjectFilters({
	searchTerm,
	setSearchTerm,
	categoryFilter,
	setCategoryFilter,
	difficultyFilter,
	setDifficultyFilter,
	costFilter,
	setCostFilter
}: ProjectFiltersProps) {
	return (
		<div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
			<div className="relative flex-grow">
				<Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search projects"
					className="pl-8"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
			</div>
			<div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
				<Select value={categoryFilter} onValueChange={setCategoryFilter}>
					<SelectTrigger className="w-full sm:w-[140px] lg:w-[180px]">
						<SelectValue placeholder="Category" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="All">All Categories</SelectItem>
						<SelectItem value="Web Development">Web Development</SelectItem>
						<SelectItem value="Mobile Development">
							Mobile Development
						</SelectItem>
						<SelectItem value="Machine Learning">Machine Learning</SelectItem>
						<SelectItem value="Blockchain">Blockchain</SelectItem>
						<SelectItem value="Backend Development">
							Backend Development
						</SelectItem>
					</SelectContent>
				</Select>
				<Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
					<SelectTrigger className="w-full sm:w-[140px] lg:w-[180px]">
						<SelectValue placeholder="Difficulty" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="All">All Difficulties</SelectItem>
						<SelectItem value="Beginner">Beginner</SelectItem>
						<SelectItem value="Intermediate">Intermediate</SelectItem>
						<SelectItem value="Advanced">Advanced</SelectItem>
					</SelectContent>
				</Select>
				<Select value={costFilter} onValueChange={setCostFilter}>
					<SelectTrigger className="w-full sm:w-[140px] lg:w-[180px]">
						<SelectValue placeholder="Cost" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="All">All Projects</SelectItem>
						<SelectItem value="Free">Free Projects</SelectItem>
						<SelectItem value="Paid">Paid Projects</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
