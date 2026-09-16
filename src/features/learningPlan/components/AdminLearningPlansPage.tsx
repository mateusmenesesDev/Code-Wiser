'use client';

import { ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '~/common/components/ui/card';
import { LearningPlan } from './LearningPlan';
import { api } from '~/trpc/react';

export default function AdminLearningPlansPage() {
	const [selectedLearnerId, setSelectedLearnerId] = useState('');
	const usersQuery = api.user.listAll.useQuery({ take: 100 });
	const users = usersQuery.data?.users ?? [];

	return (
		<main className="container mx-auto space-y-6 px-4 py-8">
			<header>
				<div className="flex items-center gap-3">
					<ClipboardList className="h-7 w-7 text-primary" aria-hidden="true" />
					<h1 className="font-bold text-3xl">Learning plans</h1>
				</div>
				<p className="mt-2 text-muted-foreground">
					Create and maintain an explicit sequence of actions for a learner.
				</p>
			</header>

			<Card>
				<CardContent className="p-5">
					<label className="space-y-2 text-sm">
						<span className="font-medium">Learner</span>
						<select
							className="h-10 w-full rounded-md border bg-background px-3 text-sm"
							value={selectedLearnerId}
							onChange={(event) => setSelectedLearnerId(event.target.value)}
						>
							<option value="">Choose a learner</option>
							{users.map((user) => (
								<option key={user.id} value={user.id}>
									{user.name || user.email}
								</option>
							))}
						</select>
					</label>
				</CardContent>
			</Card>

			{selectedLearnerId && (
				<LearningPlan key={selectedLearnerId} learnerId={selectedLearnerId} />
			)}
		</main>
	);
}
