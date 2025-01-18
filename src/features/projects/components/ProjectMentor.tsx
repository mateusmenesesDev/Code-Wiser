import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from '~/common/components/ui/avatar';

interface ProjectMentorProps {
	mentor: string;
}

export function ProjectMentor({ mentor }: ProjectMentorProps) {
	return (
		<div className="mb-4 flex items-center">
			<Avatar className="mr-2 h-10 w-10">
				<AvatarImage src={'/placeholder.svg?height=40&width=40'} alt={mentor} />
				<AvatarFallback>{mentor[0]}</AvatarFallback>
			</Avatar>
			<div>
				<p className="font-semibold">{mentor}</p>
				<p className="text-muted-foreground text-sm">Project Mentor</p>
			</div>
		</div>
	);
}
