import { NextResponse } from 'next/server';
import { env } from '~/env';
import { db } from '~/server/db';
import { processTaskDeadlineReminders } from '~/server/services/taskDeadline/taskDeadlineReminders';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	if (request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const result = await processTaskDeadlineReminders(db);
		return NextResponse.json(
			{ success: result.failures === 0, ...result },
			{ status: result.failures === 0 ? 200 : 500 }
		);
	} catch (error) {
		console.error('Error in task-deadline-reminders cron:', error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}
