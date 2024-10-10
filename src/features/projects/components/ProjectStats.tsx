import { Calendar, CreditCard, Users } from 'lucide-react';
import { Badge } from '~/common/components/badge';

interface ProjectStatsProps {
	category: string;
	difficulty: string;
	participants: number;
	maxParticipants: number;
	timeline: string;
	credits: number;
}

export function ProjectStats({
	category,
	difficulty,
	participants,
	maxParticipants,
	timeline,
	credits
}: ProjectStatsProps) {
	return (
		<div className="mb-4 flex flex-wrap gap-4">
			<Badge
				variant="secondary"
				className="bg-secondary text-secondary-foreground"
			>
				{category}
			</Badge>
			<Badge variant="outline" className="text-foreground">
				{difficulty}
			</Badge>
			<div className="flex items-center text-muted-foreground text-sm">
				<Users className="mr-1 h-4 w-4" />
				<span>
					{participants}/{maxParticipants} participants
				</span>
			</div>
			<div className="flex items-center text-muted-foreground text-sm">
				<Calendar className="mr-1 h-4 w-4" />
				<span>{timeline}</span>
			</div>
			<div className="flex items-center text-muted-foreground text-sm">
				<CreditCard className="mr-1 h-4 w-4" />
				<span>{credits} credits</span>
			</div>
		</div>
	);
}
