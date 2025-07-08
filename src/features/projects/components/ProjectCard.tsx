import {
	Check,
	Clock,
	Code2,
	CreditCard,
	Eye,
	Gift,
	Play,
	Users,
	Zap
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import {
	getAccessTypeColor,
	getCategoryColor,
	getDifficultyColor
} from '~/common/utils/colorUtils';
import { getAccessType } from '~/common/utils/projectUtils';
import { cn } from '~/lib/utils';
import { useProjectMutations } from '../hooks/useProjectMutations';
import type { ProjectTemplateApiResponse } from '../types/Projects.type';

type ProjectCardProps = {
	projectTemplate: ProjectTemplateApiResponse;
	approvalPage?: boolean;
	userCredits: number;
	isEnrolled?: boolean;
};

export function ProjectCard({
	projectTemplate,
	userCredits,
	isEnrolled = false
}: ProjectCardProps) {
	const router = useRouter();
	const { createProjectAsync, isCreateProjectPending } = useProjectMutations();

	const handleContinue = () => {
		router.push(`/workspace/${projectTemplate.id}`);
	};

	const handleCreateProject = async () => {
		toast.promise(
			createProjectAsync({
				projectTemplateId: projectTemplate.id
			}),
			{
				loading: 'Creating project...',
				success: 'Project created successfully',
				error: 'Failed to create project'
			}
		);
	};

	const accessType = getAccessType(projectTemplate.credits);
	const estimatedTime = projectTemplate.expectedDuration || '4-6 weeks';

	const getAccessTypeIcon = (accessType: 'Free' | 'Credits') => {
		switch (accessType) {
			case 'Free':
				return <Gift className="h-3 w-3" />;
			case 'Credits':
				return <Zap className="h-3 w-3" />;
			default:
				return null;
		}
	};

	return (
		<>
			<Card className="group hover:-translate-y-2 overflow-hidden border-0 shadow-md transition-all duration-300 hover:shadow-xl">
				{/* Thumbnail placeholder */}
				<div className="relative overflow-hidden">
					<div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
						<div className="text-center">
							<div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
								<Code2 className="h-8 w-8 text-blue-600" />
							</div>
							<p className="font-medium text-blue-700">
								{projectTemplate.category.name}
							</p>
						</div>
					</div>
					<div className="absolute top-3 right-3">
						<Badge className={`${getAccessTypeColor(accessType)} font-medium`}>
							{getAccessTypeIcon(accessType)}
							<span className="ml-1">{accessType}</span>
						</Badge>
					</div>
				</div>

				<CardHeader className="pb-3">
					<div className="flex items-start justify-between gap-3">
						<CardTitle className="line-clamp-2 font-bold text-lg transition-colors group-hover:text-blue-600">
							{projectTemplate.title}
						</CardTitle>
					</div>

					<CardDescription className="line-clamp-2">
						{projectTemplate.description}
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-4">
					{/* Category and Difficulty */}
					<div className="flex items-center gap-2">
						<Badge
							className={`${getCategoryColor(projectTemplate.category.name)} font-medium text-xs`}
						>
							{projectTemplate.category.name}
						</Badge>
						<Badge
							variant="outline"
							className={`${getDifficultyColor(projectTemplate.difficulty)} font-medium text-xs`}
						>
							{projectTemplate.difficulty}
						</Badge>
					</div>

					{/* Technologies */}
					{projectTemplate.technologies &&
						projectTemplate.technologies.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{projectTemplate.technologies.slice(0, 4).map((tech) => (
									<Badge
										key={tech.id}
										variant="secondary"
										className="bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
									>
										{tech.name}
									</Badge>
								))}
								{projectTemplate.technologies.length > 4 && (
									<Badge
										variant="secondary"
										className="bg-gray-100 text-gray-500 text-xs"
									>
										+{projectTemplate.technologies.length - 4} more
									</Badge>
								)}
							</div>
						)}

					{/* Project Info */}
					<div className="flex items-center justify-between text-gray-500 text-sm">
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4" />
							<span>{estimatedTime}</span>
						</div>
						<div className="flex items-center gap-2">
							<Users className="h-4 w-4" />
							<span>{projectTemplate.minParticipants} participants</span>
						</div>
					</div>

					{/* Credits */}
					<div
						className={cn(
							'flex items-center gap-2 text-sm',
							projectTemplate.credits &&
								projectTemplate.credits > 0 &&
								userCredits < projectTemplate.credits
								? 'text-red-600'
								: 'text-gray-500'
						)}
					>
						<CreditCard className="h-4 w-4" />
						<span>
							{projectTemplate.credits && projectTemplate.credits > 0
								? `${projectTemplate.credits} credits`
								: 'Free'}
						</span>
					</div>
				</CardContent>

				<CardFooter className="pt-0">
					<div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						{isEnrolled ? (
							<Button
								size="sm"
								className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto"
								onClick={handleContinue}
							>
								<Check className="mr-2 h-4 w-4" />
								Continue
							</Button>
						) : (
							<Button
								size="sm"
								className="w-full bg-gray-100 text-gray-700 transition-colors hover:bg-blue-600 hover:text-white group-hover:bg-blue-600 group-hover:text-white sm:w-auto"
								onClick={handleCreateProject}
								disabled={isCreateProjectPending}
								variant="secondary"
							>
								<Play className="mr-2 h-4 w-4" />
								Start Project
							</Button>
						)}

						<Button
							variant="outline"
							size="sm"
							asChild
							className="w-full sm:w-auto"
						>
							<Link href={`/project/${projectTemplate.id}`}>
								<Eye className="mr-2 h-4 w-4" />
								See More
							</Link>
						</Button>
					</div>
				</CardFooter>
			</Card>
		</>
	);
}
