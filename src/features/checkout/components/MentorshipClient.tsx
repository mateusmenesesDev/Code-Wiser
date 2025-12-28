'use client';

import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent } from '~/common/components/ui/card';
import { EXTERNAL_LINKS } from '~/common/constants/externalLinks';

export function MentorshipClient() {
	const handleScheduleMentorship = () => {
		window.open(EXTERNAL_LINKS.FREE_MENTORSHIP, '_blank');
		toast.info('Scheduling Discovery Call');
	};

	return (
		<Card className="border-epic-border">
			<CardContent className="space-y-6 p-6">
				<div className="rounded-lg bg-linear-to-r from-epic-muted to-info-muted p-4">
					<h5 className="mb-2 font-semibold text-epic-muted-foreground">
						Discovery Call - Free
					</h5>
					<p className="mb-4 text-epic-muted-foreground text-sm">
						Start with a 30-minute discovery call to discuss your goals and see
						if mentorship is right for you.
					</p>

					<Button
						onClick={handleScheduleMentorship}
						className="w-full"
						variant="primary"
					>
						<Calendar className="mr-2 h-4 w-4" />
						Schedule Discovery Call
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
