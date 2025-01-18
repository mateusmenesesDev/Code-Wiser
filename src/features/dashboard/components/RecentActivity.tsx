import { Badge } from '~/common/components/ui/badge';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from '~/common/components/ui/tabs';

export function RecentActivity() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Activity</CardTitle>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="all">
					<TabsList>
						<TabsTrigger value="all">All</TabsTrigger>
						<TabsTrigger value="projects">Projects</TabsTrigger>
						<TabsTrigger value="mentorship">Mentorship</TabsTrigger>
					</TabsList>
					<TabsContent value="all">
						<ActivityList
							activities={[
								{
									type: 'Project',
									description: 'Submitted pull request for E-commerce Platform'
								},
								{
									type: 'Mentorship',
									description:
										'Completed code review session with Alice Johnson'
								},
								{
									type: 'Project',
									description: 'Started new task in Task Management App'
								}
							]}
						/>
					</TabsContent>
					<TabsContent value="projects">
						<ActivityList
							activities={[
								{
									type: 'Project',
									description: 'Submitted pull request for E-commerce Platform'
								},
								{
									type: 'Project',
									description: 'Started new task in Task Management App'
								}
							]}
						/>
					</TabsContent>
					<TabsContent value="mentorship">
						<ActivityList
							activities={[
								{
									type: 'Mentorship',
									description:
										'Completed code review session with Alice Johnson'
								}
							]}
						/>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}

type Activity = {
	type: string;
	description: string;
};

function ActivityList({ activities }: { activities: Activity[] }) {
	return (
		<ul className="mt-4 space-y-4">
			{activities.map((activity) => (
				<li key={activity.type} className="flex items-center space-x-3">
					<Badge variant="secondary">{activity.type}</Badge>
					<span>{activity.description}</span>
				</li>
			))}
		</ul>
	);
}
